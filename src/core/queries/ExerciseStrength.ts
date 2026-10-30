import { localDateKey } from '../support/localDate';
import { estimatedOneRepMax } from '../analytics/EstimatedOneRepMax';
import { strengthTrend } from '../analytics/StrengthTrend';
import type { Database } from '../db/Database';
import type { ExerciseRow } from '../models/Exercise';
import type { WorkoutSet } from '../models/WorkoutSet';

/** One day's best qualifying estimate in kg and its original, unrounded set. */
export interface ExerciseStrengthSession {
  readonly workoutId: number;
  /** Calendar day in the phone's time zone, YYYY-MM-DD (`localDateKey`), like History and the calendar. */
  readonly date: string;
  readonly e1rmKilograms: number;
  readonly bestSet: Pick<WorkoutSet, 'weightKilograms' | 'reps' | 'rpe'>;
}

/** Raw daily maxima and smoothed kg, oldest first; missing estimates/rates are null, never zero. */
export interface ExerciseStrengthSeries {
  readonly sessions: readonly ExerciseStrengthSession[];
  readonly trend: readonly { readonly date: string; readonly e1rmKilograms: number }[];
  /** Latest smoothed e1RM in kg, including a held (unchanged) final point. */
  readonly latest: number | null;
  readonly changePerWeekPercent: number | null;
}

interface StrengthSetRow extends Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps' | 'rpe'> {
  readonly workoutId: number;
  readonly startedAt: string;
}

interface WeightedSession extends ExerciseStrengthSession {
  readonly trendWeight: number;
}

/**
 * Read-only strength history for finished, completed sets through `now`.
 * Report, "The recommended algorithms, in one place", items 1, 2 and 4.
 * Daily maxima include repeated exercise entries and multiple workouts; workoutId
 * identifies the winning set's workout. Ties keep the first logged set. Raw held
 * outliers remain in sessions; the trend holds them until a future confirmation
 * flow exists. Missing exercises/metadata or no qualifying sets return empty data.
 */
function series(db: Database, exerciseId: number, now: Date): ExerciseStrengthSeries {
  const exercise = db.get<ExerciseRow>('SELECT * FROM exercise WHERE id = ?', [exerciseId]);
  const days = new Map<string, WeightedSession>();
  if (exercise !== undefined) {
    const rows = db.all<StrengthSetRow>(
      `
      SELECT w.id AS workoutId, w.startedAt, s.kind, s.weightKilograms, s.reps, s.rpe
      FROM workout w
      JOIN workoutExercise we ON we.workoutId = w.id
      JOIN workoutSet s ON s.workoutExerciseId = we.id
      WHERE we.exerciseId = ? AND w.isInProgress = 0 AND s.isCompleted = 1
        AND w.startedAt <= ?
      ORDER BY w.startedAt, w.id, we.position, s.position
      `,
      [exerciseId, now.toISOString()],
    );
    for (const row of rows) {
      const estimate = estimatedOneRepMax(row, exercise);
      if (estimate === null) continue;
      const date = localDateKey(row.startedAt);
      const previous = days.get(date);
      if (previous !== undefined && previous.e1rmKilograms >= estimate.e1rmKilograms) continue;
      days.set(date, {
        workoutId: row.workoutId,
        date,
        e1rmKilograms: estimate.e1rmKilograms,
        bestSet: { weightKilograms: row.weightKilograms, reps: row.reps, rpe: row.rpe },
        trendWeight: estimate.trendWeight,
      });
    }
  }
  const sessions = [...days.values()];
  // Sessions use civil dates indexed at UTC midnight. Compare against today's civil date too:
  // east of UTC, today's label can otherwise appear to be in the future just after midnight.
  const today = new Date(`${localDateKey(now)}T00:00:00.000Z`);
  const result = strengthTrend(sessions, today);
  return {
    sessions: sessions.map(({ workoutId, date, e1rmKilograms, bestSet }) => ({
      workoutId,
      date,
      e1rmKilograms,
      bestSet,
    })),
    trend: result.trend.map(({ date, e1rmKilograms }) => ({ date, e1rmKilograms })),
    latest: result.latest,
    changePerWeekPercent: result.changePerWeekPercent,
  };
}

/** Read-only daily exercise strength query; formulas are owned by the pure analytics functions. */
export const ExerciseStrength = { series } as const;
