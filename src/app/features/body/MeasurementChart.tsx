import { useState } from 'react';
import type { BodyMeasurement } from '../../../core/models/BodyMeasurement';
import type { MeasurementUnit } from '../../../core/measurements/MeasurementSite';
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

/** Both states share the existing chart frame, scale, marks, touch readout and table. */
export function MeasurementChart({
  entries,
  unit,
}: {
  readonly entries: readonly BodyMeasurement[];
  readonly unit: MeasurementUnit;
}) {
  const { ref, width } = useChartSize();
  const [selected, setSelected] = useState<number | null>(null);
  const points = entries.map((entry) => ({ date: entry.takenAt, value: measurementValueIn(entry.value, unit) }));
  const relaxed = points.filter((_, index) => entries[index]?.state === 'relaxed');
  const flexed = points.filter((_, index) => entries[index]?.state === 'flexed');
  const scales = chartScales(points, width);
  const picked = selected === null ? undefined : entries[selected];
  const bothStates = relaxed.length > 0 && flexed.length > 0;
  return (
    <section className={styles.stack} aria-label="Measurement history chart">
      <p className={styles.caption}>History · {unit}</p>
      {bothStates && (
        <p className={styles.legend}>
          <span>Relaxed · thick</span>
          <span>Flexed · thin</span>
        </p>
      )}
      {!bothStates && entries.length > 0 && (
        <p className={styles.caption}>{entries[0]?.state === 'flexed' ? 'Flexed' : 'Relaxed'}</p>
      )}
      <p className={styles.caption} aria-live="polite">
        {picked === undefined
          ? 'Touch the chart to inspect a measurement.'
          : `${measurementTimestamp(picked.takenAt)} · ${picked.state} · ${measurementText(picked.value, unit)}`}
      </p>
      <div ref={ref}>
        {entries.length === 0 ? (
          <p className={styles.caption}>Log a measurement to see its history.</p>
        ) : (
          <ChartFrame width={width} scales={scales} label={`Relaxed and flexed measurements in ${unit}`}>
            {bothStates ? (
              <ComparisonLines recent={relaxed} baseline={flexed} scales={scales} />
            ) : (
              <TrendLine points={points} scales={scales} />
            )}
            <DotSeries points={relaxed} scales={scales} />
            <DotSeries points={flexed} scales={scales} />
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
          columns={['Date', 'State', `Value (${unit})`]}
          rows={entries.map((entry) => ({
            key: String(entry.id),
            cells: [measurementTimestamp(entry.takenAt), entry.state, measurementText(entry.value, unit)],
          }))}
        />
      )}
    </section>
  );
}
