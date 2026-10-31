import { normalizeMachineBrand } from '../library/MachineBrands';
import type { Database } from '../db/Database';
import type { TemplateDraft, TemplateExerciseDraft } from './TemplateDraft';
import type { SetKind } from '../models/SetKind';
import { TemplateCatalog } from '../queries/TemplateCatalog';
import { WorkoutLoggerLimits } from '../logging/WorkoutLogger';
import { TemplateStoreError } from './TemplateStoreError';

function nameOrThrow(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new TemplateStoreError('emptyName');
  return trimmed;
}
function validate(draft: TemplateDraft): void {
  nameOrThrow(draft.name);
  if (draft.exercises.length === 0) throw new TemplateStoreError('noExercises');
  for (const exercise of draft.exercises) {
    if (exercise.sets.length === 0) throw new TemplateStoreError('noSets');
    for (const set of exercise.sets) {
      if (
        exercise.progression === 'double' &&
        set.kind !== 'warmup' &&
        (set.targetRepsLow === null || set.targetRepsHigh === null || set.targetRepsLow <= 0)
      ) {
        throw new TemplateStoreError('invalidReps');
      }
      for (const reps of [set.targetRepsLow, set.targetRepsHigh]) {
        if (reps !== null && (!Number.isInteger(reps) || reps < 0)) throw new TemplateStoreError('invalidReps');
      }
      if (set.targetRepsLow !== null && set.targetRepsHigh !== null && set.targetRepsHigh < set.targetRepsLow)
        throw new TemplateStoreError('invalidReps');
      if (
        set.targetRpe !== null &&
        !(
          set.targetRpe >= WorkoutLoggerLimits.rpeRange.minimum && set.targetRpe <= WorkoutLoggerLimits.rpeRange.maximum
        )
      )
        throw new TemplateStoreError('invalidRpe');
    }
  }
}
function requireFolder(db: Database, folderId: number | null): void {
  if (folderId !== null && db.value<number>('SELECT id FROM templateFolder WHERE id = ?', [folderId]) === undefined)
    throw new TemplateStoreError('notFound');
}
function requireTemplate(db: Database, id: number): { folderId: number | null } {
  const row = db.get<{ folderId: number | null }>('SELECT folderId FROM template WHERE id = ?', [id]);
  if (row === undefined) throw new TemplateStoreError('notFound');
  return row;
}
function orderedTemplates(db: Database, folderId: number | null): number[] {
  return db
    .all<{ id: number }>('SELECT id FROM template WHERE folderId IS ? ORDER BY position, id', [folderId])
    .map((row) => row.id);
}
function assign(db: Database, table: 'template' | 'templateFolder', ids: readonly number[]): void {
  ids.forEach((id, position) => db.run(`UPDATE ${table} SET position = ? WHERE id = ?`, [position, id]));
}
function move(ids: number[], id: number, position: number): number[] {
  const order = ids.filter((item) => item !== id);
  order.splice(Math.max(0, Math.min(position, order.length)), 0, id);
  return order;
}
/** Atomic operations for folders and workout templates. */
export const TemplateStore = {
  /** Appends a named folder and returns its id. */
  createFolder(db: Database, name: string): number {
    return db.transaction(
      () =>
        db.run('INSERT INTO templateFolder (name, position) VALUES (?, ?)', [
          nameOrThrow(name),
          db.value<number>('SELECT COUNT(*) FROM templateFolder') ?? 0,
        ]).lastInsertRowId,
    );
  },
  /** Renames a folder. */
  renameFolder(db: Database, id: number, name: string): void {
    db.transaction(() => {
      if (db.run('UPDATE templateFolder SET name = ? WHERE id = ?', [nameOrThrow(name), id]).changes === 0)
        throw new TemplateStoreError('notFound');
    });
  },
  /** Moves a folder to a clamped zero-based position. */
  reorderFolder(db: Database, id: number, position: number): void {
    db.transaction(() => {
      const ids = db.all<{ id: number }>('SELECT id FROM templateFolder ORDER BY position, id').map((row) => row.id);
      if (!ids.includes(id)) throw new TemplateStoreError('notFound');
      assign(db, 'templateFolder', move(ids, id, position));
    });
  },
  /** Deletes a folder and appends its templates to the unfiled list. */
  deleteFolder(db: Database, id: number): void {
    db.transaction(() => {
      requireFolder(db, id);
      const order = [...orderedTemplates(db, null), ...orderedTemplates(db, id)];
      db.run('DELETE FROM templateFolder WHERE id = ?', [id]);
      assign(db, 'template', order);
      assign(
        db,
        'templateFolder',
        db.all<{ id: number }>('SELECT id FROM templateFolder ORDER BY position, id').map((row) => row.id),
      );
    });
  },
  /** Creates or replaces a template atomically, returning its id. */
  save(db: Database, draft: TemplateDraft, now: Date): number {
    return db.transaction(() => {
      validate(draft);
      requireFolder(db, draft.folderId);
      const time = now.toISOString();
      let id = draft.id;
      if (id === undefined) {
        id = db.run(
          `INSERT INTO template (name, folderId, position, notes, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            nameOrThrow(draft.name),
            draft.folderId,
            orderedTemplates(db, draft.folderId).length,
            draft.notes,
            time,
            time,
          ],
        ).lastInsertRowId;
      } else {
        const old = requireTemplate(db, id);
        const position =
          old.folderId === draft.folderId
            ? (db.value<number>('SELECT position FROM template WHERE id = ?', [id]) ?? 0)
            : orderedTemplates(db, draft.folderId).length;
        db.run('UPDATE template SET name = ?, folderId = ?, position = ?, notes = ?, updatedAt = ? WHERE id = ?', [
          nameOrThrow(draft.name),
          draft.folderId,
          position,
          draft.notes,
          time,
          id,
        ]);
        if (old.folderId !== draft.folderId) assign(db, 'template', orderedTemplates(db, old.folderId));
        db.run('DELETE FROM templateExercise WHERE templateId = ?', [id]);
      }
      for (const [position, exercise] of draft.exercises.entries()) {
        const entry = db.run(
          `INSERT INTO templateExercise (templateId, exerciseId, position, supersetGroup, notes, progression, machineBrand)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            exercise.exerciseId,
            position,
            exercise.supersetGroup,
            exercise.notes,
            exercise.progression ?? null,
            normalizeMachineBrand(exercise.machineBrand ?? ''),
          ],
        ).lastInsertRowId;
        for (const [setPosition, set] of exercise.sets.entries()) {
          db.run(
            `INSERT INTO templateSet (templateExerciseId, position, kind, targetRepsLow, targetRepsHigh, targetRpe)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [entry, setPosition, set.kind, set.targetRepsLow, set.targetRepsHigh, set.targetRpe],
          );
        }
      }
      return id;
    });
  },
  /** Renames a template and updates its modification time. */
  rename(db: Database, id: number, name: string, now: Date): void {
    db.transaction(() => {
      if (
        db.run('UPDATE template SET name = ?, updatedAt = ? WHERE id = ?', [nameOrThrow(name), now.toISOString(), id])
          .changes === 0
      )
        throw new TemplateStoreError('notFound');
    });
  },
  /** Moves a template to the end of a folder or the unfiled list. */
  move(db: Database, id: number, folderId: number | null): void {
    db.transaction(() => {
      const old = requireTemplate(db, id);
      requireFolder(db, folderId);
      if (old.folderId === folderId) return;
      db.run('UPDATE template SET folderId = ?, position = ? WHERE id = ?', [
        folderId,
        orderedTemplates(db, folderId).length,
        id,
      ]);
      assign(db, 'template', orderedTemplates(db, old.folderId));
    });
  },
  /** Moves a template to a clamped zero-based position in its current folder. */
  reorder(db: Database, id: number, position: number): void {
    db.transaction(() => {
      const { folderId } = requireTemplate(db, id);
      assign(db, 'template', move(orderedTemplates(db, folderId), id, position));
    });
  },
  /** Copies a template and appends “ copy” to its name. */
  duplicate(db: Database, id: number, now: Date): number {
    return db.transaction(() => {
      const draft = TemplateCatalog.detail(db, id);
      if (draft === undefined) throw new TemplateStoreError('notFound');
      const { id: ignored, ...copy } = draft;
      void ignored;
      return TemplateStore.save(db, { ...copy, name: `${copy.name} copy` }, now);
    });
  },
  /** Deletes a template and closes its position gap. */
  delete(db: Database, id: number): void {
    db.transaction(() => {
      const { folderId } = requireTemplate(db, id);
      db.run('DELETE FROM template WHERE id = ?', [id]);
      assign(db, 'template', orderedTemplates(db, folderId));
    });
  },
  /** Creates a template from a finished workout; targets remain unspecified. */
  createFromWorkout(db: Database, workoutId: number, name: string, folderId: number | null, now: Date): number {
    return db.transaction(() => {
      const workout = db.get<{ isInProgress: number; endedAt: string | null }>(
        'SELECT isInProgress, endedAt FROM workout WHERE id = ?',
        [workoutId],
      );
      if (workout === undefined || workout.isInProgress !== 0 || workout.endedAt === null)
        throw new TemplateStoreError('workoutNotFinished');
      const exercises: TemplateExerciseDraft[] = db
        .all<{
          id: number;
          exerciseId: number;
          supersetGroup: number | null;
          notes: string | null;
          machineBrand: string | null;
        }>(
          `
        SELECT id, exerciseId, supersetGroup, notes, machineBrand FROM workoutExercise WHERE workoutId = ? ORDER BY position
      `,
          [workoutId],
        )
        .map(({ id, ...exercise }) => ({
          ...exercise,
          sets: db
            .all<{ kind: SetKind }>('SELECT kind FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position', [id])
            .map(({ kind }) => ({ kind, targetRepsLow: null, targetRepsHigh: null, targetRpe: null })),
        }));
      return TemplateStore.save(db, { name, folderId, notes: null, exercises }, now);
    });
  },
};
