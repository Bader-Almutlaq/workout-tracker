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

/** A signed change with the actual reference date, or the first recorded date. */
export function measurementChangeText(
  value: number | null,
  unit: MeasurementUnit,
  reference: string | null,
  first: string | null,
): string {
  const date = (iso: string) =>
    new Intl.DateTimeFormat(FORMAT_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  if (value === null || reference === null) return first === null ? 'No entries' : `first entry ${date(first)}`;
  const rounded = Number(measurementValueIn(value, unit).toFixed(textPolicy.maximumFractionDigits));
  return `${signedFormat.format(rounded === 0 ? 0 : rounded).replace('-', '−')} ${unit} since ${date(reference)}`;
}

/** Partition groups by whether either state has a recorded value. */
export function partitionMeasurementGroups(groups: readonly MeasurementGroup[]) {
  const measured: MeasurementGroup[] = [];
  const unmeasured: MeasurementGroup[] = [];
  for (const group of groups) {
    if (group.sites.some((summary) => summary.site.key === 'bodyweight')) continue;
    (group.sites.some((site) => site.relaxed.latest !== null || site.flexed.latest !== null)
      ? measured
      : unmeasured
    ).push(group);
  }
  return { measured, unmeasured };
}

/** Display unit for a site's dimension. */
export function siteUnit(site: MeasurementSiteSummary['site'], units: MeasurementUnits): MeasurementUnit {
  return site.kind === 'length' ? units.lengthUnit : units.weightUnit;
}

/** Side-labelled latest values on one paired row, omitting unrecorded sides. */
export function groupValues(group: MeasurementGroup, state: MeasurementState, units: MeasurementUnits): string {
  const values = group.sites
    .map((summary) => {
      const side = summary.site.side === 'left' ? 'L ' : summary.site.side === 'right' ? 'R ' : '';
      const value = summary[state].latest?.value;
      return value === undefined
        ? null
        : side + numberFormat.format(measurementValueIn(value, siteUnit(summary.site, units)));
    })
    .filter((value) => value !== null);
  if (values.length === 0) return '—';
  const unit = group.sites[0]?.site.kind === 'mass' ? units.weightUnit : units.lengthUnit;
  return `${values.join(' · ')} ${unit}`;
}

/** A local datetime input value that uses minute precision. */
export function measurementDateInput(iso: string): string {
  const date = new Date(iso);
  const offsetMilliseconds = date.getTimezoneOffset() * textPolicy.millisecondsPerMinute;
  return new Date(date.getTime() - offsetMilliseconds).toISOString().slice(0, 16);
}

/** Display-only body regions; custom parts retain their own section and pairs stay intact. */
export function measurementSection(group: MeasurementGroup): string {
  if (group.sites.some((summary) => summary.site.isCustom)) return 'Custom';
  if (['thighs', 'calves'].includes(group.key)) return 'Lower body';
  if (['waist', 'hips', 'upper-abs', 'lower-abs'].includes(group.key)) return 'Midsection';
  return 'Upper body';
}
