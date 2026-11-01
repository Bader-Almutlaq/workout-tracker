import { personalCurve, type PersonalCurve, type PersonalCurveSet } from '../analytics/PersonalCurve';
import type { Database } from '../db/Database';
import type { StrengthExercise } from '../analytics/EstimatedOneRepMax';

/**
 * Canonical database boundary for personal curves. Finished, completed history through now,
 * across all saved workouts and machines, supplies one curve per exercise (report item 3).
 * Scope and machine selection change the displayed sessions, never the identity of the lift's curve.
 */
export function ExerciseCurve(
  db: Database,
  exerciseId: number,
  exercise: StrengthExercise,
  now = new Date(),
): PersonalCurve {
  const sets = db.all<PersonalCurveSet>(
    `
    SELECT s.kind, s.weightKilograms, s.reps, s.rpe, w.startedAt AS date
    FROM workoutSet s
    JOIN workoutExercise we ON we.id = s.workoutExerciseId
    JOIN workout w ON w.id = we.workoutId
    WHERE we.exerciseId = ? AND w.isInProgress = 0 AND s.isCompleted = 1 AND w.startedAt <= ?
    ORDER BY w.startedAt, w.id, we.position, s.position, s.id
  `,
    [exerciseId, now.toISOString()],
  );
  return personalCurve(exercise, sets);
}
