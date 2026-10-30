import type { MeasurementUnit, MeasurementState } from '../../../core/measurements/MeasurementSite';
import type { MeasurementGroup, MeasurementSiteSummary } from '../../../core/measurements/MeasurementQueries';
import type { MeasurementUnits } from '../../../core/measurements/MeasurementUnits';
import { measurementValueIn } from '../../../core/measurements/MeasurementUnits';
import { FORMAT_LOCALE } from '../../format/formatLocale';

/** Heuristic: two display decimals preserve useful tape/scale precision without changing stored values. */
const textPolicy = Object.freeze({ maximumFractionDigits: 2, millisecondsPerMinute: 60_000 });
const numberFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: textPolicy.maximumFractionDigits });
const signedFormat = new Intl.NumberFormat(FORMAT_LOCALE, {
  maximumFractionDigits: textPolicy.maximumFractionDigits,
  signDisplay: 'always',
});

/** A formatted measurement in the display unit; null is an em dash. */
export function measurementText(value: number | null, unit: MeasurementUnit): string {
  return value === null ? '—' : `${numberFormat.format(measurementValueIn(value, unit))} ${unit}`;
}

/** A descriptive signed change; null names the lack of a comparison. */
export function measurementChangeText(value: number | null, unit: MeasurementUnit, period: string): string {
  if (value === null) return `No comparison ${period}`;
  const converted = measurementValueIn(value, unit);
  const rounded = Number(converted.toFixed(textPolicy.maximumFractionDigits));
  return `${signedFormat.format(rounded === 0 ? 0 : rounded)} ${unit} ${period}`;
}

/** Display unit for a site's dimension. */
export function siteUnit(site: MeasurementSiteSummary['site'], units: MeasurementUnits): MeasurementUnit {
  return site.kind === 'length' ? units.lengthUnit : units.weightUnit;
}

/** Side-labelled latest values on one paired row; every site remains individually selectable. */
export function groupValues(group: MeasurementGroup, state: MeasurementState, units: MeasurementUnits): string {
  return group.sites
    .map((summary) => {
      const side = summary.site.side === 'left' ? 'L ' : summary.site.side === 'right' ? 'R ' : '';
      return side + measurementText(summary[state].latest?.value ?? null, siteUnit(summary.site, units));
    })
    .join(' · ');
}

/** A local datetime input value that retains seconds and milliseconds for existing entries. */
export function measurementDateInput(iso: string): string {
  const date = new Date(iso);
  const offsetMilliseconds = date.getTimezoneOffset() * textPolicy.millisecondsPerMinute;
  return new Date(date.getTime() - offsetMilliseconds).toISOString().slice(0, -1);
}
