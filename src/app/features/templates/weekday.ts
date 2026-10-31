/** ISO weekdays, in display order. */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Abbreviated ISO weekday, or an empty string for no day. */
export function weekdayText(day: number | null | undefined): string {
  return day === null || day === undefined ? '' : (WEEKDAYS[day - 1] ?? '');
}
