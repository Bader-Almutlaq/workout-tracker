/** `yyyy-MM-dd HH:mm:ss`, the shape of every Strong timestamp. */
const STRONG_TIMESTAMP = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;

/** Calendar limits used to reject impossible timestamps. */
const CalendarLimit = {
  hoursPerDay: 24,
  minutesPerHour: 60,
  secondsPerMinute: 60,
  /** Days in each month of a common year, January first. */
  daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  leapMonthIndex: 1,
} as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Whether `year-month-day` is a real calendar date (`month` is 1-based). */
function isCalendarDate(year: number, month: number, day: number): boolean {
  const common = CalendarLimit.daysInMonth[month - 1];
  if (common === undefined || day < 1) return false;
  const leapDay = month - 1 === CalendarLimit.leapMonthIndex && isLeapYear(year) ? 1 : 0;
  return day <= common + leapDay;
}

/**
 * Reads a Strong timestamp, `yyyy-MM-dd HH:mm:ss`, which Strong writes in local time.
 *
 * The time is interpreted in the device's time zone, as the native app did. A local time that
 * does not exist (skipped by a daylight-saving change) moves forward by the skipped hour; one that
 * happens twice takes the first occurrence.
 *
 * @returns The instant as a UTC ISO 8601 string, or `undefined` if `text` is not a valid timestamp.
 */
export function parseStrongTimestamp(text: string): string | undefined {
  const match = STRONG_TIMESTAMP.exec(text);
  if (match === null) return undefined;
  const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = match.slice(1).map(Number);
  if (!isCalendarDate(year, month, day)) return undefined;
  if (
    hour >= CalendarLimit.hoursPerDay ||
    minute >= CalendarLimit.minutesPerHour ||
    second >= CalendarLimit.secondsPerMinute
  ) {
    return undefined;
  }

  // `new Date(year, …)` would read years 0–99 as 1900–1999, so set the year separately.
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, 0);
  return date.toISOString();
}
