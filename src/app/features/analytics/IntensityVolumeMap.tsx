import { useState } from 'react';
import { scaleLinear } from 'd3-scale';
import type { IntensityPoint } from '../../../core/queries/IntensityMix';
import { ChartTable } from '../../design/charts/ChartTable';
import styles from './AnalyticsIntensity.module.css';

/** Weekly hard sets against mean relative intensity; tapping a point reads its values. */
export function IntensityVolumeMap({ points }: { readonly points: readonly IntensityPoint[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const width = 400;
  const height = 220;
  const padding = 32;
  const x = scaleLinear()
    .domain([0, Math.max(1, ...points.map((point) => point.sets))])
    .range([padding, width - padding]);
  const y = scaleLinear()
    .domain([0, Math.max(100, ...points.map((point) => point.intensityPercent))])
    .range([height - padding, padding]);
  const current = points.find((point) => point.weekStart === selected) ?? points.at(-1);
  return (
    <section className={styles.section}>
      <h2>Intensity × volume</h2>
      {points.length === 0 ? (
        <p>No qualifying intensity data in this period.</p>
      ) : (
        <>
          {current !== undefined && (
            <p aria-live="polite">
              Week of {current.weekStart}: {current.sets.toFixed(1)} sets, {current.intensityPercent.toFixed(0)}%
            </p>
          )}
          <svg
            className={styles.chart}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label="Weekly hard sets and relative intensity"
          >
            <text x={padding} y={padding}>
              Relative intensity %
            </text>
            <text x={padding} y={height - 4}>
              Weekly hard sets
            </text>
            {points.map((point, index) => (
              <circle
                key={point.weekStart}
                className={index === points.length - 1 ? styles.recent : styles.dot}
                cx={x(point.sets)}
                cy={y(point.intensityPercent)}
                r={index === points.length - 1 ? 7 : 5}
                role="button"
                tabIndex={0}
                aria-label={`Week of ${point.weekStart}: ${point.sets} sets, ${point.intensityPercent.toFixed(0)}%`}
                onClick={() => setSelected(point.weekStart)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelected(point.weekStart);
                }}
              />
            ))}
          </svg>
          <ChartTable
            caption="Weekly intensity and volume"
            columns={['Week', 'Sets', 'Intensity']}
            rows={points.map((point) => ({
              key: point.weekStart,
              cells: [point.weekStart, point.sets.toFixed(1), `${point.intensityPercent.toFixed(1)}%`],
            }))}
          />
        </>
      )}
    </section>
  );
}
