import { FORMAT_LOCALE } from '../../format/formatLocale';

const compact = new Intl.NumberFormat(FORMAT_LOCALE, { notation: 'compact', maximumFractionDigits: 1 });

/** Compact axis label for a number, such as 15k or 1.2k. */
export function compactTick(value: number): string {
  return compact.format(value).replace('K', 'k');
}
