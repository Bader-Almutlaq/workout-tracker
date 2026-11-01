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
  readonly weeksSinceBest?: number;
}

/** Heuristic: three sessions and eight rows make the overview useful and compact. */
export const LiftTrendPolicy = Object.freeze({
  minimumSessions: 2,
  percent: 100,
  daysPerWeek: 7,
  millisecondsPerDay: 86_400_000,
  staleWeeks: 6,
});

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
    if (periodObservations.length < LiftTrendPolicy.minimumSessions) continue;
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
    let bestValue = 0;
    let bestDate = periodObservations[0]?.date ?? from.toISOString();
    for (const observation of observations) {
      if (observation.e1rmKilograms > bestValue) {
        bestValue = observation.e1rmKilograms;
        bestDate = observation.date;
      }
    }
    result.push({
      id,
      weeksSinceBest: Math.max(
        0,
        Math.floor(
          (to.getTime() - new Date(bestDate).getTime()) /
            (LiftTrendPolicy.daysPerWeek * LiftTrendPolicy.millisecondsPerDay),
        ),
      ),
      name: exercise.name,
      unit: exercise.defaultEntryUnit,
      sessions: periodObservations.length,
      latest: trend.latest,
      changePercent: (trend.latest / first.e1rmKilograms - 1) * LiftTrendPolicy.percent,
      mixedMachines: brands.size > 1,
      points: trend.trend.filter((point) => point.date >= from.toISOString()).map((point) => point.e1rmKilograms),
    });
  }
  return result.sort((a, b) => b.changePercent - a.changePercent || a.name.localeCompare(b.name));
}

/** Median percentage change across ranked lifts; null when no lifts have sufficient history. */
export function medianLiftChange(lifts: readonly LiftTrend[]): number | null {
  const values = lifts
    .map((lift) => lift.changePercent)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);
  const upper = values[middle] ?? 0;
  return values.length % 2 === 1 ? upper : ((values[middle - 1] ?? upper) + upper) / 2;
}
