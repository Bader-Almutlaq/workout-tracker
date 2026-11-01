import { isHardSet } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import type { SetKind } from '../models/SetKind';
import { SessionDurationLimits } from './TemplateSessions';

/** Weekly training totals, median session seconds, logged effort and finished workout dates. */
export interface TrainingSummaryResult {
  readonly workoutsPerWeek: number;
  readonly hardSetsPerWeek: number;
  readonly typicalSessionSeconds: number | null;
  readonly averageRir: number | null;
  readonly rirNotLogged: number;
  readonly workouts: readonly { readonly date: string; readonly deload: boolean }[];
}

/** Heuristic: calendar weeks have seven civil days; duration excludes workouts without an end time. */
const calendar = Object.freeze({ daysPerWeek: 7, millisecondsPerDay: 86400000, millisecondsPerSecond: 1000 });

/** Finished workouts in [from, to), normalized by local weeks. Heuristic: median duration excludes implausibly long sessions; RIR = 10 − RPE (report §12). */
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
  }>(
    `
    SELECT s.kind, s.rpe, s.isCompleted
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
  const durations = workouts
    .flatMap((workout) => {
      if (workout.endedAt === null) return [];
      const seconds = (Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / calendar.millisecondsPerSecond;
      return Number.isFinite(seconds) && seconds >= 0 && seconds <= SessionDurationLimits.maximumSeconds
        ? [seconds]
        : [];
    })
    .sort((a, b) => a - b);
  const middle = Math.floor(durations.length / 2);
  const typicalSessionSeconds =
    durations.length === 0
      ? null
      : durations.length % 2 === 1
        ? (durations[middle] ?? null)
        : ((durations[middle - 1] ?? 0) + (durations[middle] ?? 0)) / 2;
  const working = sets.filter((set) => set.isCompleted === 1 && set.kind !== 'warmup');
  const logged = working.flatMap((set) => (set.rpe === null ? [] : [10 - set.rpe]));
  return {
    workoutsPerWeek: workouts.length / weeks,
    hardSetsPerWeek: sets.filter((set) => isHardSet({ ...set, isCompleted: set.isCompleted === 1 })).length / weeks,
    typicalSessionSeconds,
    averageRir: logged.length === 0 ? null : logged.reduce((sum, rir) => sum + rir, 0) / logged.length,
    rirNotLogged: working.length - logged.length,
    workouts: workouts.map((workout) => ({ date: workout.startedAt, deload: workout.deload === 1 })),
  };
}
