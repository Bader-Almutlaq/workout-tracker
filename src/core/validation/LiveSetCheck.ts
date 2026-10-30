import type { Database } from '../db/Database';
import type { SetKind } from '../models/SetKind';
import {
  checkSet,
  SetPlausibilityThreshold,
  type SetFinding,
  summariseSessions,
  type SetObservation,
} from './SetPlausibility';

interface HistoryRow {
  readonly workoutId: number;
  readonly startedAt: string;
  readonly kind: SetKind;
  readonly weightKilograms: number;
  readonly reps: number;
}

/**
 * Checks a candidate against completed sets in the newest finished sessions, excluding the current workout.
 * Heuristic: uses the same plausibility rules as import review; zero working reps are always flagged.
 */
export function liveSetFinding(
  db: Database,
  exerciseId: number,
  weightKilograms: number,
  reps: number,
  kind: SetKind,
  excludingWorkout: number | null,
  now: Date,
): SetFinding | undefined {
  const rows = db.all<HistoryRow>(
    `
    SELECT w.id AS workoutId, w.startedAt, s.kind, s.weightKilograms, s.reps
    FROM workoutSet s JOIN workoutExercise we ON we.id = s.workoutExerciseId
    JOIN workout w ON w.id = we.workoutId
    WHERE we.exerciseId = ? AND s.isCompleted = 1 AND w.isInProgress = 0 AND w.id IS NOT ?
      AND w.id IN (
        SELECT w2.id FROM workout w2 JOIN workoutExercise we2 ON we2.workoutId = w2.id
        JOIN workoutSet s2 ON s2.workoutExerciseId = we2.id
        WHERE we2.exerciseId = ? AND s2.isCompleted = 1 AND w2.isInProgress = 0 AND w2.id IS NOT ?
        GROUP BY w2.id ORDER BY w2.startedAt DESC LIMIT ?
      )
  `,
    [exerciseId, excludingWorkout, exerciseId, excludingWorkout, SetPlausibilityThreshold.neighbourSessions],
  );
  const observations = rows.map((row, index): SetObservation => ({
    id: index,
    exerciseKey: 'history',
    sessionKey: String(row.workoutId),
    date: row.startedAt,
    kind: row.kind,
    weightKilograms: row.weightKilograms,
    reps: row.reps,
  }));
  const sessions = summariseSessions(observations);
  return checkSet(
    { id: 0, exerciseKey: 'candidate', sessionKey: 'candidate', date: now.toISOString(), kind, weightKilograms, reps },
    sessions,
  );
}
