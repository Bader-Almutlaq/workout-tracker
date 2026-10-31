import { estimatedOneRepMax } from '../analytics/EstimatedOneRepMax';
import { EffectiveRepsDefaults } from '../analytics/EffectiveReps';
import type { Database } from '../db/Database';
import { isWorkSetKind } from '../models/SetKind';
import { ExerciseSeries, type ExerciseSeriesPoint } from './ExerciseSeries';

/** Heuristic: the owner's requested 1–12-rep table, with predictions at RIR 0 (maximal effort). */
const policy = Object.freeze({ minimumReps: 1, maximumReps: 12, unitLoadKilograms: 1 });

/** Best actual load achieving at least this many reps, plus an unrounded prediction in kg for display via shared estimateText. */
export interface RepMaxRow {
  readonly reps: number;
  readonly best: ExerciseSeriesPoint | null;
  readonly predictedKilograms: number | null;
}

/** Dated lifetime records in kg or kg × reps, and the weight-reps table; unsupported tracking returns no rep rows. */
export interface ExerciseRecords {
  readonly estimatedOneRepMax: ExerciseSeriesPoint | null;
  readonly heaviestWeight: ExerciseSeriesPoint | null;
  readonly sessionVolume: ExerciseSeriesPoint | null;
  readonly repMax: readonly RepMaxRow[];
}

function best(points: readonly ExerciseSeriesPoint[]): ExerciseSeriesPoint | null {
  return points.reduce<ExerciseSeriesPoint | null>(
    (previous, point) => (previous === null || point.value > previous.value ? point : previous),
    null,
  );
}

/**
 * Lifetime records and rep-max predictions. Research report, recommended algorithms 1, 2 and 5:
 * predicted load = best e1RM / (1 + (reps − 1) / k), at RIR 0.
 * Obtain the denominator by estimating a unit-load set with the canonical formula, avoiding a second k/eligibility implementation.
 * No qualifying e1RM means null predictions. Actual performances need no logged effort and exclude warm-ups; ties keep the earliest set.
 * Predictions stay exact kg here; the UI uses shared estimate rounding (0.5 kg / 1 lb).
 */
export function RepMaxTable(db: Database, exerciseId: number, now = new Date()): ExerciseRecords {
  const history = ExerciseSeries.read(db, exerciseId, now);
  const estimate = best(ExerciseSeries.estimatedOneRepMax(history));
  const exercise = history.exercise;
  const repMax: RepMaxRow[] = [];
  if (exercise?.tracking === 'weight-reps') {
    for (let reps = policy.minimumReps; reps <= policy.maximumReps; reps += 1) {
      let performance: ExerciseSeriesPoint | null = null;
      for (const session of history.sessions) {
        for (const set of session.sets) {
          if (
            !isWorkSetKind(set.kind) ||
            !Number.isInteger(set.reps) ||
            set.reps < reps ||
            !Number.isFinite(set.weightKilograms) ||
            set.weightKilograms <= 0
          )
            continue;
          if (performance === null || set.weightKilograms > performance.value) {
            performance = { workoutId: session.workoutId, date: session.date, value: set.weightKilograms, set };
          }
        }
      }
      const factor = estimatedOneRepMax(
        { kind: 'working', weightKilograms: policy.unitLoadKilograms, reps, rpe: EffectiveRepsDefaults.maximumRpe },
        exercise,
      );
      repMax.push({
        reps,
        best: performance,
        predictedKilograms: estimate === null || factor === null ? null : estimate.value / factor.e1rmKilograms,
      });
    }
  }
  return {
    estimatedOneRepMax: estimate,
    heaviestWeight: best(ExerciseSeries.heaviestWeight(history)),
    sessionVolume: best(ExerciseSeries.sessionVolume(history)),
    repMax,
  };
}
