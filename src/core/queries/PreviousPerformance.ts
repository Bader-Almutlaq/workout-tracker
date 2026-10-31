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
