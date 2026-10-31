import { estimatedOneRepMax } from '../analytics/EstimatedOneRepMax';
import { strengthTrend } from '../analytics/StrengthTrend';
import type { Database } from '../db/Database';
import type { WeightUnit } from '../units/WeightUnit';
import { ExerciseSeries } from './ExerciseSeries';

/** A lift's smoothed estimates in kg and change over its qualifying observations. */
export interface LiftTrend {
  readonly id: number;
  readonly name: string;
  readonly unit: WeightUnit;
  readonly sessions: number;
  readonly latest: number;
  readonly changePercent: number;
  readonly mixedMachines: boolean;
  readonly points: readonly number[];
}

/** Heuristic: three sessions and eight rows make the overview useful and compact. */
const policy = Object.freeze({ minimumSessions: 3, maximumLifts: 8, percent: 100 });

/** Session maxima feed the shared EWMA; block change = (last / first − 1) × 100 (report §12). Deload entries are excluded. */
export function LiftTrends(db: Database, from: Date, to: Date): readonly LiftTrend[] {
  const ids = db.all<{ id: number }>(
    `
    SELECT DISTINCT e.id FROM exercise e JOIN workoutExercise we ON we.exerciseId = e.id
    JOIN workout w ON w.id = we.workoutId
    WHERE e.tracking = 'weight-reps' AND w.isInProgress = 0 AND w.startedAt >= ? AND w.startedAt < ?
  `,
    [from.toISOString(), to.toISOString()],
  );
  const result: LiftTrend[] = [];
  for (const { id } of ids) {
    const history = ExerciseSeries.read(db, id, to);
    const exercise = history.exercise;
    if (exercise === null) continue;
    const sessions = history.sessions.filter(
      (session) => session.date < to.toISOString() && session.deloadEntryIds.length === 0,
    );
    const observations = sessions.flatMap((session) => {
      let best: ReturnType<typeof estimatedOneRepMax> = null;
      for (const set of session.sets) {
        if (session.deloadEntryIds.includes(set.workoutExerciseId)) continue;
        const estimate = estimatedOneRepMax(set, exercise);
        if (estimate !== null && (best === null || estimate.e1rmKilograms > best.e1rmKilograms)) best = estimate;
      }
      return best === null
        ? []
        : [{ date: session.date, e1rmKilograms: best.e1rmKilograms, trendWeight: best.trendWeight }];
    });
    const periodObservations = observations.filter((observation) => observation.date >= from.toISOString());
    if (periodObservations.length < policy.minimumSessions) continue;
    const trend = strengthTrend(observations, to);
    const first = trend.trend.filter((point) => point.date < from.toISOString()).at(-1) ?? trend.trend[0];
    if (first === undefined || trend.latest === null) continue;
    const brands = new Set(
      sessions
        .filter((session) => session.date >= from.toISOString())
        .flatMap((session) =>
          session.machineEntries.flatMap((entry) =>
            entry.machineBrand === null ? [] : [entry.machineBrand.toLowerCase()],
          ),
        ),
    );
    result.push({
      id,
      name: exercise.name,
      unit: exercise.defaultEntryUnit,
      sessions: periodObservations.length,
      latest: trend.latest,
      changePercent: (trend.latest / first.e1rmKilograms - 1) * policy.percent,
      mixedMachines: brands.size > 1,
      points: trend.trend.filter((point) => point.date >= from.toISOString()).map((point) => point.e1rmKilograms),
    });
  }
  return result.sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name)).slice(0, policy.maximumLifts);
}
