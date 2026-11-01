import { useState } from 'react';
import { line } from 'd3-shape';
import { ChartTable } from '../../design/charts/ChartTable';
import styles from './AnalyticsIntensity.module.css';

/** One dated series, with selectable marks and a table. */
export function WeeklyChart({
  title,
  points,
  bars = false,
}: {
  readonly title: string;
  readonly points: readonly { readonly date: string; readonly value: number | null; readonly deload: boolean }[];
  readonly bars?: boolean;
}) {
  const [selected, setSelected] = useState<string>();
  const maximum = Math.max(1, ...points.map((point) => point.value ?? 0));
  const width = Math.max(1, points.length);
  const x = (index: number) => ((index + 0.5) * 100) / width;
  const y = (value: number) => 90 - (value / maximum) * 80;
  const path =
    line<{ date: string; value: number | null; deload: boolean }>()
      .defined((point) => point.value !== null)
      .x((_, index) => x(index))
      .y((point) => y(point.value ?? 0))(points) ?? '';
  const last = points.filter((point) => point.value !== null).at(-1);
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <p>
        {last === undefined
          ? 'No data in this period.'
          : `Latest week: ${last.value?.toFixed(1)}${bars ? ' sets' : ' RIR'}.`}{' '}
        Each {bars ? 'bar' : 'point'} is one week.
      </p>
      {points.some((point) => point.deload) && <p>Yellow marks: deload week</p>}
      <svg viewBox="0 0 100 100" className={styles.chart} role="img" aria-label={title}>
        {!bars && <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="1" />}
        {points.map((point, index) =>
          point.value === null ? null : bars ? (
            <rect
              key={point.date}
              x={x(index) - 35 / width}
              y={y(point.value)}
              width={70 / width}
              height={90 - y(point.value)}
              fill={point.deload ? 'var(--color-status-warning)' : 'var(--color-accent)'}
              onClick={() => setSelected(point.date)}
            >
              <title>
                {point.date}: {point.value.toFixed(1)}
              </title>
            </rect>
          ) : (
            <circle
              key={point.date}
              cx={x(index)}
              cy={y(point.value)}
              r="1.5"
              fill={point.deload ? 'var(--color-status-warning)' : 'var(--color-accent)'}
              onClick={() => setSelected(point.date)}
            >
              <title>
                {point.date}: {point.value.toFixed(1)}
              </title>
            </circle>
          ),
        )}
      </svg>
      {selected !== undefined && (
        <p>
          {selected}: {points.find((point) => point.date === selected)?.value?.toFixed(1)}
        </p>
      )}
      <ChartTable
        caption={title}
        columns={['Week', 'Value', 'Deload']}
        rows={points.map((point) => ({
          key: point.date,
          cells: [point.date, point.value?.toFixed(1) ?? '—', point.deload ? 'Yes' : 'No'],
        }))}
      />
    </section>
  );
}
