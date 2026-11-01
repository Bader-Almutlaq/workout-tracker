import { FORMAT_LOCALE } from '../../format/formatLocale';
import { TimeChartPolicy, type ChartBucket } from './timeChartMath';

/** Local date/period label matching the bucket; sessions include time to distinguish same-day entries. */
export function chartPeriodText(date: string, size: ChartBucket, span = 1): string {
  const value = new Date(date);
  const text = new Intl.DateTimeFormat(FORMAT_LOCALE, {
    month: 'short',
    year: 'numeric',
    ...(size === 'day' || size === 'week' || size === 'session' ? { day: 'numeric' } : {}),
    ...(size === 'session' ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(value);
  if (size === 'week') return `Week of ${text}`;
  if (size === 'quarter') {
    const start = `Q${Math.floor(value.getMonth() / TimeChartPolicy.monthsPerQuarter) + 1} ${value.getFullYear()}`;
    if (span === 1) return start;
    const end = new Date(value);
    end.setMonth(end.getMonth() + (span - 1) * TimeChartPolicy.monthsPerQuarter);
    return `${start} – Q${Math.floor(end.getMonth() / TimeChartPolicy.monthsPerQuarter) + 1} ${end.getFullYear()}`;
  }
  return text;
}
