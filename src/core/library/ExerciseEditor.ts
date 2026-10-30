import { WarmupSchemes } from '../logging/WarmupPlan';
import type { Database } from '../db/Database';
import type { ExerciseRow } from '../models/Exercise';
import type { CustomExerciseDraft } from './CustomExerciseDraft';
import { ExerciseEditError } from './ExerciseEditError';
import { exerciseIdNamed } from './ExerciseNameResolver';
import { replaceExerciseMuscles } from './replaceExerciseMuscles';

/** Nullable loading overrides in exact kg; omitted fields use defaults when saving a loading group. */
export interface ExerciseLoadingSettings {
  readonly loadStepKilograms?: number | null;
  readonly barWeightKilograms?: number | null;
  readonly warmupSetCount?: number | null;
}

function validateLoading(settings: ExerciseLoadingSettings): void {
  const { loadStepKilograms: step, barWeightKilograms: bar, warmupSetCount: count } = settings;
  if (
    (step !== null && step !== undefined && (!Number.isFinite(step) || step <= 0)) ||
    (bar !== null && bar !== undefined && (!Number.isFinite(bar) || bar < 0)) ||
    (count !== null && count !== undefined && (!Number.isInteger(count) || WarmupSchemes[count] === undefined))
  ) {
    throw new ExerciseEditError('invalidLoadingSettings');
  }
}

/** The draft's name, trimmed, and its muscles, with any primary muscle removed from the secondary list. */
function validate(draft: CustomExerciseDraft) {
  validateLoading(draft);
  const name = (draft.name ?? '').trim();
  if (name.length === 0) throw new ExerciseEditError('emptyName');
  const primary = draft.primaryMuscles ?? [];
  if (primary.length === 0) throw new ExerciseEditError('noPrimaryMuscle');
  return { name, primary, secondary: (draft.secondaryMuscles ?? []).filter((muscle) => !primary.includes(muscle)) };
}

/** Throws `nameInUse` when another exercise (other than `except`) already has this name or alias. */
function ensureFree(db: Database, name: string, except: number | null): void {
  const id = exerciseIdNamed(db, name);
  if (id !== undefined && id !== except) throw new ExerciseEditError('nameInUse', name);
}

/** Creates, edits, archives and merges database exercises. */
export const ExerciseEditor = {
  /** Creates a custom exercise and returns its id. `now` becomes its creation timestamp. */
  create(db: Database, draft: CustomExerciseDraft, now: Date): number {
    const validated = validate(draft);
    return db.transaction(() => {
      ensureFree(db, validated.name, null);
      const result = db.run(
        `INSERT INTO exercise
           (name, equipment, movementPattern, mechanic, source, isLengthenedBiased, tracking, createdAt)
         VALUES (?, ?, ?, ?, 'custom', ?, ?, ?)`,
        [
          validated.name,
          draft.equipment ?? null,
          draft.pattern ?? null,
          draft.mechanic ?? null,
          Number(draft.isLengthenedBiased ?? false),
          draft.tracking ?? 'weight-reps',
          now.toISOString(),
        ],
      );
      ExerciseEditor.setLoadingSettings(db, result.lastInsertRowId, draft);
      replaceExerciseMuscles(db, result.lastInsertRowId, validated.primary, validated.secondary);
      return result.lastInsertRowId;
    });
  },
  /** Edits a custom or Strong exercise without changing its history. */
  update(db: Database, id: number, draft: CustomExerciseDraft): void {
    const validated = validate(draft);
    db.transaction(() => {
      const exercise = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [id]);
      if (exercise === undefined) throw new ExerciseEditError('notFound');
      if (exercise.libraryKey !== null) throw new ExerciseEditError('libraryExerciseIsReadOnly');
      ensureFree(db, validated.name, id);
      db.run(
        `UPDATE exercise
            SET name = ?, equipment = ?, movementPattern = ?, mechanic = ?, isLengthenedBiased = ?, tracking = ?, source = ?
          WHERE id = ?`,
        [
          validated.name,
          draft.equipment ?? null,
          draft.pattern ?? null,
          draft.mechanic ?? null,
          Number(draft.isLengthenedBiased ?? false),
          draft.tracking ?? 'weight-reps',
          // Editing a Strong exercise makes it the owner's own.
          exercise.source === 'strong' ? 'custom' : exercise.source,
          id,
        ],
      );
      if (exercise.name !== validated.name) {
        // Future Strong exports still contain the old name; renaming must not split its history.
        db.run('INSERT OR IGNORE INTO exerciseAlias (alias, exerciseId) VALUES (?, ?)', [exercise.name, id]);
      }
      // Older callers which only edit metadata do not clear newly introduced settings.
      ExerciseEditor.setLoadingSettings(db, id, {
        loadStepKilograms:
          draft.loadStepKilograms === undefined ? (exercise.loadStepKilograms ?? null) : draft.loadStepKilograms,
        barWeightKilograms:
          draft.barWeightKilograms === undefined ? (exercise.barWeightKilograms ?? null) : draft.barWeightKilograms,
        warmupSetCount: draft.warmupSetCount === undefined ? (exercise.warmupSetCount ?? null) : draft.warmupSetCount,
      });
      replaceExerciseMuscles(db, id, validated.primary, validated.secondary);
    });
  },
  /** Saves the loading group on any exercise without changing library metadata or history. Null resets defaults. */
  setLoadingSettings(db: Database, id: number, settings: ExerciseLoadingSettings): void {
    validateLoading(settings);
    if (
      db.run(
        `
      UPDATE exercise SET loadStepKilograms = ?, barWeightKilograms = ?, warmupSetCount = ? WHERE id = ?
    `,
        [settings.loadStepKilograms ?? null, settings.barWeightKilograms ?? null, settings.warmupSetCount ?? null, id],
      ).changes === 0
    ) {
      throw new ExerciseEditError('notFound');
    }
  },
  /** Hides or shows an exercise without deleting its history. */
  setArchived(db: Database, id: number, archived: boolean): void {
    db.run('UPDATE exercise SET isArchived = ? WHERE id = ?', [Number(archived), id]);
  },
  /** Moves one exercise's history and aliases to another. The caller (the worker) must take a safety snapshot first. */
  merge(db: Database, source: number, target: number): number {
    return ExerciseEditor.mergeAll(db, new Map([[source, target]]));
  },
  /** Applies all source-to-target merges atomically. The caller (the worker) must take a safety snapshot first. */
  mergeAll(db: Database, targetsBySource: ReadonlyMap<number, number>): number {
    for (const [source, target] of targetsBySource) {
      if (source === target) throw new ExerciseEditError('mergeIntoItself');
    }
    return db.transaction(() => {
      let moved = 0;
      for (const [sourceId, targetId] of [...targetsBySource].sort((a, b) => a[0] - b[0])) {
        const source = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [sourceId]);
        const target = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [targetId]);
        if (source === undefined || target === undefined) throw new ExerciseEditError('notFound');
        // A target with no history yet takes the unit the owner used for the source.
        const targetUses =
          db.value<number>('SELECT COUNT(*) FROM workoutExercise WHERE exerciseId = ?', [targetId]) ?? 0;
        if (targetUses === 0) {
          db.run('UPDATE exercise SET defaultEntryUnit = ? WHERE id = ?', [source.defaultEntryUnit, targetId]);
        }
        moved += db.run('UPDATE workoutExercise SET exerciseId = ? WHERE exerciseId = ?', [targetId, sourceId]).changes;
        db.run('UPDATE templateExercise SET exerciseId = ? WHERE exerciseId = ?', [targetId, sourceId]);
        db.run('UPDATE exerciseAlias SET exerciseId = ? WHERE exerciseId = ?', [targetId, sourceId]);
        // The old name keeps working for imports and search.
        db.run('INSERT OR REPLACE INTO exerciseAlias (alias, exerciseId) VALUES (?, ?)', [source.name, targetId]);
        db.run('DELETE FROM exercise WHERE id = ?', [sourceId]);
      }
      return moved;
    });
  },
};
