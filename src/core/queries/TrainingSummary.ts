import { isHardSet } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import type { SetKind } from '../models/SetKind';

/** Weekly training totals and finished workout dates; time is seconds and volume is kg × reps. */
export interface TrainingSummaryResult {
  readonly workoutsPerWeek: number;
  readonly hardSetsPerWeek: number;
  readonly secondsPerWeek: number;
  readonly volumePerWeek: number;
  readonly workouts: readonly { readonly date: string; readonly deload: boolean }[];
}

/** Heuristic: calendar weeks have seven civil days; duration excludes workouts without an end time. */
const calendar = Object.freeze({ daysPerWeek: 7, millisecondsPerDay: 86400000, millisecondsPerSecond: 1000 });

/** Finished workouts in [from, to), normalized by whole local weeks. Tonnage is descriptive (report §12). */
export function TrainingSummary(db: Database, from: Date, to: Date): TrainingSummaryResult {
  const workouts = db.all<{ id: number; startedAt: string; endedAt: string | null; deload: number }>(
    `
    SELECT w.id, w.startedAt, w.endedAt,
      EXISTS (SELECT 1 FROM workoutExercise we WHERE we.workoutId = w.id AND we.deloadStage IS NOT NULL) AS deload
    FROM workout w WHERE w.isInProgress = 0 AND w.startedAt >= ? AND w.startedAt < ? ORDER BY w.startedAt
  `,
    [from.toISOString(), to.toISOString()],
  );
  const sets = db.all<{
    kind: SetKind;
    rpe: number | null;
    isCompleted: number;
    weightKilograms: number;
    reps: number;
  }>(
    `
    SELECT s.kind, s.rpe, s.isCompleted, s.weightKilograms, s.reps
    FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
    JOIN workoutSet s ON s.workoutExerciseId = we.id
    WHERE w.isInProgress = 0 AND w.startedAt >= ? AND w.startedAt < ?
  `,
    [from.toISOString(), to.toISOString()],
  );
  const days =
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
    calendar.millisecondsPerDay;
  const weeks = Math.max(1, days / calendar.daysPerWeek);
  const seconds = workouts.reduce(
    (sum, workout) =>
      sum +
      (workout.endedAt === null
        ? 0
        : Math.max(0, (Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / calendar.millisecondsPerSecond)),
    0,
  );
  return {
    workoutsPerWeek: workouts.length / weeks,
    hardSetsPerWeek: sets.filter((set) => isHardSet({ ...set, isCompleted: set.isCompleted === 1 })).length / weeks,
    secondsPerWeek:
      ((seconds / (workouts.filter((workout) => workout.endedAt !== null).length || 1)) * workouts.length) / weeks,
    volumePerWeek:
      sets
        .filter((set) => set.isCompleted === 1 && set.kind !== 'warmup')
        .reduce((sum, set) => sum + set.weightKilograms * set.reps, 0) / weeks,
    workouts: workouts.map((workout) => ({ date: workout.startedAt, deload: workout.deload === 1 })),
  };
}
