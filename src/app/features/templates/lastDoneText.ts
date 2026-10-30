import { FORMAT_LOCALE } from '../../format/formatLocale';

const relativeFormat = new Intl.RelativeTimeFormat(FORMAT_LOCALE, { numeric: 'auto' });

const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

/** Calendar days from `from` to `to` in the phone's time zone, so 23:00 yesterday is one day ago, not zero. */
function calendarDaysBetween(from: Date, to: Date): number {
  const startOf = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOf(to) - startOf(from)) / MILLISECONDS_PER_DAY);
}

/**
 * "Last done 3 days ago" for a template that was started before; `undefined` when it never was.
 * Under two weeks counts in days, then weeks, months and years.
 */
export function lastDoneText(lastStartedAt: string | null, now: Date): string | undefined {
  if (lastStartedAt === null) return undefined;
  const days = Math.max(0, calendarDaysBetween(new Date(lastStartedAt), now));
  if (days < 2 * DAYS_PER_WEEK) return `Last done ${relativeFormat.format(-days, 'day')}`;
  if (days < 2 * DAYS_PER_MONTH) return `Last done ${relativeFormat.format(-Math.floor(days / DAYS_PER_WEEK), 'week')}`;
  if (days < DAYS_PER_YEAR) return `Last done ${relativeFormat.format(-Math.floor(days / DAYS_PER_MONTH), 'month')}`;
  return `Last done ${relativeFormat.format(-Math.floor(days / DAYS_PER_YEAR), 'year')}`;
}
