import { FORMAT_LOCALE } from './formatLocale';

const MILLISECONDS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

/** The calendar month a list section is labelled with, e.g. "January 2024". `month` is 1–12. */
export function monthLabel(year: number, month: number): string {
  // Midday on the 1st cannot move to another month in any time zone.
  const date = new Date(Date.UTC(year, month - 1, 1, 12));
  return new Intl.DateTimeFormat(FORMAT_LOCALE, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(date);
}

/**
 * A day for a list row, e.g. "Mon, Jan 8".
 *
 * @param timeZone An IANA zone; the phone's own zone when omitted.
 */
export function dayText(isoTimestamp: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(FORMAT_LOCALE, { timeZone, weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(isoTimestamp),
  );
}

/**
 * The day and time of a workout, e.g. "Mon, Jan 8, 2024, 10:00 AM".
 *
 * @param timeZone An IANA zone; the phone's own zone when omitted.
 */
export function dayAndTimeText(isoTimestamp: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(FORMAT_LOCALE, {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoTimestamp));
}

/**
 * How long a workout lasted, e.g. "1h 7m", "59m" or "2h", rounded to the nearest minute.
 * `undefined` when the end is unknown or the length rounds to zero, so the screen shows nothing
 * rather than a made-up figure.
 */
export function durationText(startedAt: string, endedAt: string | null): string | undefined {
  if (endedAt === null) return undefined;
  const minutes = Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / MILLISECONDS_PER_MINUTE);
  if (!Number.isFinite(minutes) || minutes <= 0) return undefined;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainder = minutes % MINUTES_PER_HOUR;
  if (hours === 0) return `${remainder}m`;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
