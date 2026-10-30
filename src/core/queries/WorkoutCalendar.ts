import { localDateKey } from '../support/localDate';
import type { Database } from '../db/Database';

/** A local calendar date and the finished workout IDs started on it, newest first. */
export interface WorkoutCalendarDay {
  readonly date: string;
  readonly workoutIds: readonly number[];
}

/** Finished workouts started in the given local calendar month (month is 1–12). */
export function workoutDaysInMonth(db: Database, year: number, month: number): WorkoutCalendarDay[] {
  const rows = db.all<{ id: number; startedAt: string }>(
    'SELECT id, startedAt FROM workout WHERE isInProgress = 0 ORDER BY startedAt DESC, id DESC',
  );
  const days = new Map<string, number[]>();
  for (const row of rows) {
    const date = new Date(row.startedAt);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month) continue;
    const key = localDateKey(date);
    const ids = days.get(key) ?? [];
    ids.push(row.id);
    days.set(key, ids);
  }
  return [...days].map(([date, workoutIds]) => ({ date, workoutIds }));
}
