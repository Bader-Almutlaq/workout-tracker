import { FORMAT_LOCALE } from '../../format/formatLocale';

const timestampFormat = new Intl.DateTimeFormat(FORMAT_LOCALE, { dateStyle: 'medium', timeStyle: 'short' });

/** A local date and time so multiple same-day measurements remain distinguishable. */
export function measurementTimestamp(iso: string): string {
  return timestampFormat.format(new Date(iso));
}
