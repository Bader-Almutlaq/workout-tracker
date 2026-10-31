import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementSite, MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { measurementValueIn } from '../../../core/measurements/MeasurementUnits';
import { LongRangeChart } from '../../design/charts/LongRangeChart';
import { FORMAT_LOCALE } from '../../format/formatLocale';

/** Heuristic: two decimals keep tape values readable without rounding storage. */
const numberFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 2 });

/** Mean per calendar period, separately for each side in the selected state and display unit. */
export function MeasurementChart({
  title,
  entries,
  unit,
  sites,
}: {
  /** The body part's name, shown as the full-screen title. */
  readonly title: string;
  readonly entries: readonly BodyMeasurement[];
  readonly unit: MeasurementUnit;
  readonly sites: readonly MeasurementSite[];
}) {
  return (
    <LongRangeChart
      title={title}
      aggregation="mean"
      formatValue={(value) => `${numberFormat.format(value)} ${unit}`}
      series={sites.map((site) => ({
        name: site.name,
        points: entries
          .filter((entry) => entry.site === site.key)
          .map((entry) => ({ date: entry.takenAt, value: measurementValueIn(entry.value, unit) })),
      }))}
    />
  );
}
