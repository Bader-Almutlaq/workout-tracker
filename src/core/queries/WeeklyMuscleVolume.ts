import { HardSetPolicy } from '../analytics/HardSets';
import { muscleVolume, type MuscleVolume, type MuscleVolumeSet } from '../analytics/MuscleVolume';
import type { Database } from '../db/Database';

/** The Monday local date and fractional hard sets for all muscles, including muscles with zero sets. */
export interface WeeklyMuscleVolume {
  readonly weekStart: string;
  readonly muscles: readonly MuscleVolume[];
}

/** Heuristic: civil-calendar constants for Monday-based weeks, matching the History calendar's local dates. */
const CalendarWeek = Object.freeze({ days: 7, monday: 1, sunday: 0 });

/** An invalid date prevents a local calendar week from being selected. */
export class WeeklyMuscleVolumeError extends Error {
  readonly kind = 'invalidDate';

  /** Ask for valid range endpoints before reading the database. */
  constructor() {
    super('Choose valid start and end dates for weekly muscle volume.');
    this.name = 'WeeklyMuscleVolumeError';
  }
}

function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = monday.getDay();
  monday.setDate(
    monday.getDate() - (weekday === CalendarWeek.sunday ? CalendarWeek.days : weekday) + CalendarWeek.monday,
  );
  return monday;
}

function localDateKey(date: Date): string {
  return [
    date.getFullYear().toString().padStart(4, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
  ].join('-');
}

/**
 * Finished workouts grouped by their start's local Monday week, from the week containing `from`
 * through the week containing `to`, inclusive. Returns zero-filled weeks and muscles; a reversed
 * range returns []. Calendar increments preserve local weeks across daylight-saving changes.
 * Imported workouts without an end/completion timestamp still count; planned sets never count.
 * Fractional counting and zones are delegated to muscleVolume (research report, item 10).
 */
export function weeklyMuscleVolume(
  db: Database,
  from: Date,
  to: Date,
  secondaryWeight: number = HardSetPolicy.secondaryWeight,
): WeeklyMuscleVolume[] {
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) throw new WeeklyMuscleVolumeError();
  if (from > to) return [];
  const firstMonday = mondayOf(from);
  const lastMonday = mondayOf(to);
  const end = new Date(lastMonday);
  end.setDate(end.getDate() + CalendarWeek.days);
  const rows = db.all<Omit<MuscleVolumeSet, 'isCompleted'> & { startedAt: string; isCompleted: number }>(
    `
      SELECT w.id AS workoutId, w.startedAt, em.muscleId AS muscle, em.role,
             s.kind, s.rpe, s.isCompleted
      FROM workout w
      JOIN workoutExercise we ON we.workoutId = w.id
      JOIN workoutSet s ON s.workoutExerciseId = we.id
      JOIN exerciseMuscle em ON em.exerciseId = we.exerciseId
      WHERE w.isInProgress = 0 AND w.startedAt >= ? AND w.startedAt < ?
      ORDER BY w.startedAt, w.id, we.position, s.position
    `,
    [firstMonday.toISOString(), end.toISOString()],
  );
  const weeks = new Map<string, MuscleVolumeSet[]>();
  for (const row of rows) {
    const weekStart = localDateKey(mondayOf(new Date(row.startedAt)));
    const sets = weeks.get(weekStart) ?? [];
    sets.push({ ...row, isCompleted: row.isCompleted === 1 });
    weeks.set(weekStart, sets);
  }
  const result: WeeklyMuscleVolume[] = [];
  for (
    const monday = new Date(firstMonday);
    monday <= lastMonday;
    monday.setDate(monday.getDate() + CalendarWeek.days)
  ) {
    const weekStart = localDateKey(monday);
    result.push({ weekStart, muscles: muscleVolume(weeks.get(weekStart) ?? [], secondaryWeight) });
  }
  return result;
}
