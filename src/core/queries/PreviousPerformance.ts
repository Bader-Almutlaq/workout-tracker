import type { Database } from '../db/Database';
import { fromWorkoutSetRow, type WorkoutSet, type WorkoutSetRow } from '../models/WorkoutSet';

/** Completed sets from the latest finished session of an exercise, in logged order. */
export function previousPerformance(
  db: Database,
  exerciseId: number,
  excludingWorkout: number | null = null,
): WorkoutSet[] {
  const workoutId = db.value<number>(
    `
    SELECT w.id FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
    WHERE we.exerciseId = ? AND w.isInProgress = 0 AND w.id IS NOT ?
    ORDER BY w.startedAt DESC LIMIT 1
  `,
    [exerciseId, excludingWorkout],
  );
  if (workoutId === undefined) return [];
  return db
    .all<WorkoutSetRow>(
      `
    SELECT s.* FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
    WHERE we.workoutId = ? AND we.exerciseId = ? AND s.isCompleted = 1
    ORDER BY we.position, s.position
  `,
      [workoutId, exerciseId],
    )
    .map(fromWorkoutSetRow);
}
