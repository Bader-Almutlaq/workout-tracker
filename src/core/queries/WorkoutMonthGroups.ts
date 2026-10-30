import type { WorkoutSummary } from './WorkoutHistory';

/** Workouts of one calendar month, newest first. */
export interface WorkoutMonthGroup {
  readonly year: number;
  /** 1 (January) to 12 (December). */
  readonly month: number;
  readonly workouts: readonly WorkoutSummary[];
}

/** The calendar year and month (1–12) of `isoTimestamp` as seen in `timeZone` (the phone's zone when omitted). */
function calendarMonth(isoTimestamp: string, timeZone: string | undefined): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric' }).formatToParts(
    new Date(isoTimestamp),
  );
  const numberOf = (type: 'year' | 'month') => Number(parts.find((part) => part.type === type)?.value);
  return { year: numberOf('year'), month: numberOf('month') };
}

/**
 * Groups workouts by the calendar month they started in, in the phone's time zone, so a late
 * session on the 31st lands in the month the owner remembers. Input order is kept inside each
 * group; groups are ordered newest month first.
 *
 * @param summaries Workouts newest first, as `workoutSummaries` returns them.
 * @param timeZone An IANA zone such as `Asia/Riyadh`; the phone's own zone when omitted.
 */
export function groupWorkoutsByMonth(
  summaries: readonly WorkoutSummary[],
  timeZone?: string,
): WorkoutMonthGroup[] {
  const groups = new Map<string, { year: number; month: number; workouts: WorkoutSummary[] }>();
  for (const summary of summaries) {
    const { year, month } = calendarMonth(summary.startedAt, timeZone);
    const key = `${year}-${month}`;
    const group = groups.get(key) ?? { year, month, workouts: [] };
    group.workouts.push(summary);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.year - a.year || b.month - a.month);
}
