import type { Database } from '../db/Database';
import { isHardSet, type HardSet } from '../analytics/HardSets';
import { muscleVolume } from '../analytics/MuscleVolume';
import type { SeriesPoint } from '../analytics/RecentVsBaseline';
import type { Muscle } from '../library/Muscle';
import type { MuscleRole } from '../library/MuscleRole';
import { localDateKey } from '../support/localDate';

/** Inclusive local calendar dates (YYYY-MM-DD); omission of muscleId counts each hard set once. */
export interface DailyHardSetsOptions {
  readonly from: string;
  readonly to: string;
  readonly muscleId?: Muscle;
}

/** Invalid calendar endpoints cannot select a daily hard-set range. */
export class DailyHardSetsError extends Error {
  readonly kind = 'invalidDate';

  /** Ask for real local calendar dates before querying storage. */
  constructor() {
    super('Choose valid start and end dates for daily hard sets.');
    this.name = 'DailyHardSetsError';
  }
}

function calendarDate(key: string): Date {
  const date = new Date(`${key}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(date.getTime()) || localDateKey(date) !== key) {
    throw new DailyHardSetsError();
  }
  return date;
}

/**
 * Zero-filled daily hard sets from finished workouts, grouped by the workout start's local day
 * exactly like weeklyMuscleVolume. Imported workouts need no end/completion timestamp.
 * All training includes unmatched exercises once per set. Muscle totals delegate to muscleVolume
 * (research report, recommended algorithms item 10, Pelland 2025); hard-set eligibility to isHardSet.
 * Calendar increments preserve days across DST. A reversed range returns an empty series.
 */
export function dailyHardSets(database: Database, options: DailyHardSetsOptions): SeriesPoint[] {
  const from = calendarDate(options.from);
  const to = calendarDate(options.to);
  if (from > to) return [];
  const end = new Date(to);
  end.setDate(end.getDate() + 1);
  const muscleId = options.muscleId ?? null;
  const rows = database.all<{
    startedAt: string;
    workoutId: number;
    kind: HardSet['kind'];
    rpe: number | null;
    isCompleted: number;
    muscle: Muscle | null;
    role: MuscleRole | null;
  }>(
    `
      SELECT w.startedAt, w.id AS workoutId, s.kind, s.rpe, s.isCompleted,
             em.muscleId AS muscle, em.role
      FROM workout w
      JOIN workoutExercise we ON we.workoutId = w.id
      JOIN workoutSet s ON s.workoutExerciseId = we.id
      LEFT JOIN exerciseMuscle em ON em.exerciseId = we.exerciseId AND em.muscleId = ?
      WHERE w.isInProgress = 0 AND w.startedAt >= ? AND w.startedAt < ?
        AND (? IS NULL OR em.muscleId IS NOT NULL)
      ORDER BY w.startedAt, w.id, we.position, s.position
    `,
    [muscleId, from.toISOString(), end.toISOString(), muscleId],
  );
  const days = new Map<string, typeof rows>();
  for (const row of rows) {
    const day = localDateKey(row.startedAt);
    const sets = days.get(day) ?? [];
    sets.push(row);
    days.set(day, sets);
  }
  const result: SeriesPoint[] = [];
  for (const day = new Date(from); day <= to; day.setDate(day.getDate() + 1)) {
    const date = localDateKey(day);
    const sets = (days.get(date) ?? []).map((row) => ({ ...row, isCompleted: row.isCompleted === 1 }));
    const value =
      muscleId === null
        ? sets.filter(isHardSet).length
        : (muscleVolume(
            sets.flatMap((set) =>
              set.muscle === null || set.role === null ? [] : [{ ...set, muscle: set.muscle, role: set.role }],
            ),
          ).find((volume) => volume.muscle === muscleId)?.totalSets ?? 0);
    result.push({ date, value });
  }
  return result;
}
