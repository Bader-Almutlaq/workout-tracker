import { fromWorkoutExerciseRow, type WorkoutExercise, type WorkoutExerciseRow } from '../models/WorkoutExercise';
import type { Database } from '../db/Database';
import { fromWorkoutSetRow, type WorkoutSet, type WorkoutSetRow } from '../models/WorkoutSet';

/**
 * Completed sets in logged order; prefer the latest session of a template before falling back anywhere.
 * A zero-based occurrence selects one repeated exercise entry; null combines every entry as before.
 */
export function previousPerformance(
  db: Database,
  exerciseId: number,
  excludingWorkout: number | null = null,
  preferredTemplateId: number | null = null,
  occurrence: number | null = null,
): WorkoutSet[] {
  const workoutId = db.value<number>(
    `
    SELECT w.id FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
    WHERE we.exerciseId = ? AND w.isInProgress = 0 AND w.id IS NOT ?
    ORDER BY CASE WHEN w.templateId = ? THEN 0 ELSE 1 END, w.startedAt DESC, w.id DESC LIMIT 1
  `,
    [exerciseId, excludingWorkout, preferredTemplateId],
  );
  if (workoutId === undefined) return [];
  const entryId =
    occurrence === null
      ? null
      : db.value<number>(
          `
    SELECT id FROM workoutExercise
    WHERE workoutId = ? AND exerciseId = ?
    ORDER BY position LIMIT 1 OFFSET ?
    `,
          [workoutId, exerciseId, occurrence],
        );
  if (entryId === undefined) return [];
  return db
    .all<WorkoutSetRow>(
      `
    SELECT s.* FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
    WHERE we.workoutId = ? AND we.exerciseId = ? AND s.isCompleted = 1
      AND (? IS NULL OR we.id = ?)
    ORDER BY we.position, s.position
  `,
      [workoutId, exerciseId, entryId, entryId],
    )
    .map(fromWorkoutSetRow);
}

/** Match each current set to the corresponding previous warm-up or non-warm-up, in order. */
export function matchPreviousSets<T extends { readonly kind: string }>(
  current: readonly { readonly kind: string }[],
  previous: readonly T[],
): (T | undefined)[] {
  const warmups = previous.filter((set) => set.kind === 'warmup');
  const workSets = previous.filter((set) => set.kind !== 'warmup');
  let warmupIndex = 0;
  let workIndex = 0;
  return current.map((set) => (set.kind === 'warmup' ? warmups[warmupIndex++] : workSets[workIndex++]));
}

/** Previous finished occurrence before this entry's session (date then id); never another entry in this workout.
 * Heuristic: repeated exercises follow the same occurrence across sessions; missing occurrences have no predecessor.
 */
export function previousExerciseEntry(db: Database, entryId: number): WorkoutExercise | undefined {
  const current = db.get<{ exerciseId: number; workoutId: number; position: number; startedAt: string }>(
    `
    SELECT we.exerciseId, we.workoutId, we.position, w.startedAt
    FROM workoutExercise we JOIN workout w ON w.id = we.workoutId WHERE we.id = ?
  `,
    [entryId],
  );
  if (current === undefined) return undefined;
  const occurrence =
    db.value<number>(
      `
    SELECT COUNT(*) FROM workoutExercise WHERE workoutId = ? AND exerciseId = ? AND position < ?
  `,
      [current.workoutId, current.exerciseId, current.position],
    ) ?? 0;
  const workoutId = db.value<number>(
    `
    SELECT w.id FROM workout w WHERE w.isInProgress = 0 AND w.id <> ?
      AND (w.startedAt < ? OR (w.startedAt = ? AND w.id < ?))
      AND EXISTS (SELECT 1 FROM workoutExercise we WHERE we.workoutId = w.id AND we.exerciseId = ?)
    ORDER BY w.startedAt DESC, w.id DESC LIMIT 1
  `,
    [current.workoutId, current.startedAt, current.startedAt, current.workoutId, current.exerciseId],
  );
  if (workoutId === undefined) return undefined;
  const row = db.get<WorkoutExerciseRow>(
    `
    SELECT * FROM workoutExercise WHERE workoutId = ? AND exerciseId = ? ORDER BY position LIMIT 1 OFFSET ?
  `,
    [workoutId, current.exerciseId, occurrence],
  );
  return row === undefined ? undefined : fromWorkoutExerciseRow(row);
}

/** Pre-cycle completed sets for deload load calculations; walks stage rows back to the first normal predecessor.
 * Missing normal history returns no load baseline rather than guessing an unrounded original weight.
 */
export function deloadBaseline(db: Database, entryId: number): WorkoutSet[] {
  let previous = previousExerciseEntry(db, entryId);
  while (previous !== undefined && (previous.deloadStage ?? null) !== null)
    previous = previousExerciseEntry(db, previous.id);
  return previous === undefined ? [] : completedEntrySets(db, previous.id);
}

/** Completed sets of one known occurrence in logged order, with no template/session fallback. */
export function completedEntrySets(db: Database, entryId: number): WorkoutSet[] {
  return db
    .all<WorkoutSetRow>(
      `
    SELECT * FROM workoutSet WHERE workoutExerciseId = ? AND isCompleted = 1 ORDER BY position
  `,
      [entryId],
    )
    .map(fromWorkoutSetRow);
}
