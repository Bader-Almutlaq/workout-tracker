import type { RecentVsBaselinePoint } from '../../../core/analytics/RecentVsBaseline';
import { dayText } from '../../format/dateText';
import { FORMAT_LOCALE } from '../../format/formatLocale';

const setFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 0, signDisplay: 'exceptZero' });

/** Whole descriptive percent, with a typographic minus and no negative zero; null stays unavailable. */
export function signatureDifferenceText(percent: number | null): string {
  return percent === null ? '—' : `${percentFormat.format(percent).replace('-', '−')}%`;
}

/** Latest headline and metric caption; a missing percentage explicitly requests more history. */
export function signatureHeadline(point: RecentVsBaselinePoint | undefined, muscleName?: string) {
  const percent = point?.percentDifference ?? null;
  return {
    value: signatureDifferenceText(percent),
    caption:
      percent === null
        ? 'Not enough history yet'
        : `7-day vs 28-day ${muscleName === undefined ? 'hard' : muscleName} sets`,
  };
}

/** Fractional sets retain one decimal; unavailable windows use an em dash. */
export function signatureSetsText(value: number | null): string {
  return value === null ? '—' : setFormat.format(value);
}

/** Touch readout uses the calendar key in UTC so the weekday never shifts with the phone's zone. */
export function signatureReadout(point: RecentVsBaselinePoint): string {
  return `${dayText(point.date, 'UTC')} · last 7 days ${signatureSetsText(point.recent)} sets · baseline ${signatureSetsText(point.baseline)} · ${signatureDifferenceText(point.percentDifference)}`;
}
