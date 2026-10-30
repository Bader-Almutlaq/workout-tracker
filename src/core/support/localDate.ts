/**
 * The calendar day a UTC timestamp falls on in the phone's time zone, as `YYYY-MM-DD`.
 * The one way WorkoutCore turns a stored time into "which day": History, the calendar and
 * analytics all group by the day the owner experienced, not the UTC day.
 */
export function localDateKey(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
