import { useState } from 'react';
import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementSite, MeasurementUnit } from '../../../core/measurements/MeasurementSite';
import { measurementValueIn } from '../../../core/measurements/MeasurementUnits';
import { ChartFrame } from '../../design/charts/ChartFrame';
import { chartScales } from '../../design/charts/chartScales';
import { TrendLine } from '../../design/charts/TrendLine';
import { ComparisonLines } from '../../design/charts/ComparisonLines';
import { DotSeries } from '../../design/charts/DotSeries';
import { TouchRule } from '../../design/charts/TouchRule';
import { ChartTable } from '../../design/charts/ChartTable';
import { useChartSize } from '../../design/charts/useChartSize';
import { measurementText } from './measurementText';
import { measurementTimestamp } from './measurementTimestamp';
import styles from './Body.module.css';

/** The selected state uses one series per side on a shared chart. */
export function MeasurementChart({
  entries,
  unit,
  sites,
}: {
  readonly entries: readonly BodyMeasurement[];
  readonly unit: MeasurementUnit;
  readonly sites: readonly MeasurementSite[];
}) {
  const { ref, width } = useChartSize();
  const [selected, setSelected] = useState<number | null>(null);
  const points = entries.map((entry) => ({ date: entry.takenAt, value: measurementValueIn(entry.value, unit) }));
  const left = points.filter((_, index) => entries[index]?.site === sites[0]?.key);
  const right = points.filter((_, index) => entries[index]?.site !== sites[0]?.key);
  const scales = chartScales(points, width);
  const picked = selected === null ? undefined : entries[selected];
  return (
    <section className={styles.stack} aria-label="Measurement history chart">
      {sites.length > 1 && (
        <p className={styles.legend}>
          <span>L</span>
          <span>R</span>
        </p>
      )}
      {picked !== undefined && (
        <p className={styles.caption} aria-live="polite">
          {measurementTimestamp(picked.takenAt)} · {sites.find((site) => site.key === picked.site)?.name} ·{' '}
          {measurementText(picked.value, unit)}
        </p>
      )}
      <div ref={ref}>
        {entries.length === 0 ? (
          <p className={styles.caption}>Log a measurement to see its history.</p>
        ) : (
          <ChartFrame width={width} scales={scales} label={`Measurement history in ${unit}`}>
            {sites.length > 1 ? (
              <ComparisonLines recent={left} baseline={right} scales={scales} />
            ) : (
              <TrendLine points={points} scales={scales} />
            )}
            <DotSeries points={left} scales={scales} />
            <DotSeries points={right} scales={scales} />
            <TouchRule
              points={points}
              scales={scales}
              selectedIndex={selected}
              onSelect={setSelected}
              label="Measurement; drag or use arrow keys"
            />
          </ChartFrame>
        )}
      </div>
      {entries.length > 0 && (
        <ChartTable
          caption={`Measurement history · ${unit}`}
          columns={['Date', 'Site', `Value (${unit})`]}
          rows={entries.map((entry) => ({
            key: String(entry.id),
            cells: [
              measurementTimestamp(entry.takenAt),
              sites.find((site) => site.key === entry.site)?.name ?? entry.site,
              measurementText(entry.value, unit),
            ],
          }))}
        />
      )}
    </section>
  );
}
