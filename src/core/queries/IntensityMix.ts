import { isHardSet } from '../analytics/HardSets';
import type { Database } from '../db/Database';
import type { Muscle } from '../library/Muscle';
import type { SetKind } from '../models/SetKind';
import { localDateKey } from '../support/localDate';
import { ExerciseStrength } from './ExerciseStrength';

/** A labelled count and percentage of its distribution. */
export interface IntensityBucket {
  readonly label: string;
  readonly count: number;
  readonly percent: number;
}
/** One Monday week's hard sets with a known strength trend and their mean relative intensity. */
export interface IntensityPoint {
  readonly weekStart: string;
  readonly sets: number;
  readonly intensityPercent: number;
}
/** Working-set rep and effort distributions plus weekly relative intensity. */
export interface IntensityMixResult {
  readonly reps: readonly IntensityBucket[];
  readonly effort: readonly IntensityBucket[];
  readonly notLogged: number;
  readonly weeks: readonly IntensityPoint[];
}
interface Row {
  readonly exerciseId: number;
  readonly startedAt: string;
  readonly kind: SetKind;
  readonly rpe: number | null;
  readonly reps: number;
  readonly weightKilograms: number;
  readonly tracking: string;
}
/** Report §12 buckets; 31+ preserves higher-repetition sets, and percentages are descriptive. */
const policy = Object.freeze({ repEnds: [5, 10, 15, 30, Infinity], percent: 100, maximumRpe: 10 });
function buckets(labels: readonly string[], counts: readonly number[]): IntensityBucket[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return labels.map((label, index) => ({
    label,
    count: counts[index] ?? 0,
    percent: total === 0 ? 0 : ((counts[index] ?? 0) / total) * policy.percent,
  }));
}
/**
 * Finished completed non-warm-up sets over inclusive local dates. Report §12: hard-set rep buckets,
 * RIR = 10 − RPE, and intensity = load / exercise e1RM trend × 100. Weekly points include only
 * hard weight-reps sets with a positive load and an available trend on that day; no future trend is used.
 */
export function intensityMix(db: Database, from: Date, to: Date, muscle?: Muscle): IntensityMixResult {
  const repCounts = [0, 0, 0, 0, 0];
  const effortCounts = [0, 0, 0, 0, 0, 0];
  let notLogged = 0;
  const points = new Map<string, { sets: number; intensity: number }>();
  if (Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from <= to) {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    const rows = db.all<Row>(
      `
      SELECT e.id AS exerciseId, e.tracking, w.startedAt, s.kind, s.rpe, s.reps, s.weightKilograms
      FROM workout w JOIN workoutExercise we ON we.workoutId = w.id
      JOIN exercise e ON e.id = we.exerciseId JOIN workoutSet s ON s.workoutExerciseId = we.id
      WHERE w.isInProgress = 0 AND s.isCompleted = 1 AND s.kind != 'warmup'
        AND w.startedAt >= ? AND w.startedAt < ?
        AND (? IS NULL OR EXISTS (SELECT 1 FROM exerciseMuscle em
          WHERE em.exerciseId = e.id AND em.muscleId = ? AND em.role = 'primary'))
      ORDER BY w.startedAt, w.id, we.position, s.position
    `,
      [start.toISOString(), end.toISOString(), muscle ?? null, muscle ?? null],
    );
    const trends = new Map<number, ReturnType<typeof ExerciseStrength.series>['trend']>();
    for (const row of rows) {
      if (row.rpe === null) notLogged += 1;
      else {
        const bucket = Math.min(5, Math.max(0, Math.floor(policy.maximumRpe - row.rpe)));
        effortCounts[bucket] = (effortCounts[bucket] ?? 0) + 1;
      }
      if (!isHardSet({ ...row, isCompleted: true })) continue;
      if (Number.isInteger(row.reps) && row.reps > 0) {
        const index = policy.repEnds.findIndex((limit) => row.reps <= limit);
        repCounts[index] = (repCounts[index] ?? 0) + 1;
      }
      if (row.tracking !== 'weight-reps' || row.weightKilograms <= 0) continue;
      let trend = trends.get(row.exerciseId);
      if (trend === undefined) {
        trend = ExerciseStrength.series(db, row.exerciseId, new Date(end.getTime() - 1)).trend;
        trends.set(row.exerciseId, trend);
      }
      const date = localDateKey(row.startedAt);
      const estimate = trend.filter((point) => point.date <= date).at(-1);
      if (estimate === undefined || estimate.e1rmKilograms <= 0) continue;
      const week = new Date(row.startedAt);
      week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
      const key = localDateKey(week);
      const current = points.get(key) ?? { sets: 0, intensity: 0 };
      current.sets += 1;
      current.intensity += (row.weightKilograms / estimate.e1rmKilograms) * policy.percent;
      points.set(key, current);
    }
  }
  return {
    reps: buckets(['1–5', '6–10', '11–15', '16–30', '31+'], repCounts),
    effort: buckets(['0', '1', '2', '3', '4', '5+'], effortCounts),
    notLogged,
    weeks: [...points].map(([weekStart, point]) => ({
      weekStart,
      sets: point.sets,
      intensityPercent: point.intensity / point.sets,
    })),
  };
}
