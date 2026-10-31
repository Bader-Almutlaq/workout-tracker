import { useState } from 'react';
import { scaleLinear } from 'd3-scale';
import type { IntensityPoint } from '../../../core/queries/IntensityMix';
import { ChartTable } from '../../design/charts/ChartTable';
import { dayText } from '../../format/dateText';
import styles from './AnalyticsIntensity.module.css';

/** Heuristic: chart geometry in SVG units, and the margin kept around the data so points never sit on an edge. */
const MapLayout = Object.freeze({
  width: 400,
  height: 220,
  left: 44,
  right: 16,
  top: 16,
  bottom: 36,
  intensityMargin: 5,
  tickCount: 4,
});

/** "Mon, Oct 26" for a Monday week key (YYYY-MM-DD); midday UTC cannot shift the day. */
function weekText(weekStart: string): string {
  return dayText(`${weekStart}T12:00:00Z`, 'UTC');
}

/** Weekly hard sets against mean relative intensity; tapping a point reads its values. */
export function IntensityVolumeMap({ points }: { readonly points: readonly IntensityPoint[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { width, height, left, right, top, bottom, intensityMargin, tickCount } = MapLayout;
  const x = scaleLinear()
    .domain([0, Math.max(1, ...points.map((point) => point.sets))])
    .nice(tickCount)
    .range([left, width - right]);
  // Zoom the intensity axis to the data: weekly means usually sit within a few percent of each other.
  const intensities = points.map((point) => point.intensityPercent);
  const y = scaleLinear()
    .domain([Math.max(0, Math.min(...intensities) - intensityMargin), Math.max(...intensities) + intensityMargin])
    .nice(tickCount)
    .range([height - bottom, top]);
  const current = points.find((point) => point.weekStart === selected) ?? points.at(-1);
  return (
    <section className={styles.section}>
      <h2>Intensity × volume</h2>
      <p className={styles.quiet}>Each dot is a week: hard sets across, average load as % of estimated 1RM up.</p>
      {points.length === 0 ? (
        <p>No qualifying intensity data in this period.</p>
      ) : (
        <>
          {current !== undefined && (
            <p aria-live="polite">
              Week of {weekText(current.weekStart)}: {current.sets} hard sets, {current.intensityPercent.toFixed(0)}% of
              est. 1RM
            </p>
          )}
          <svg
            className={styles.chart}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label="Weekly hard sets and relative intensity"
          >
            {y.ticks(tickCount).map((tick) => (
              <g key={`y${tick}`}>
                <line className={styles.grid} x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} />
                <text x={left - 6} y={y(tick)} dy="0.32em" textAnchor="end">
                  {tick}%
                </text>
              </g>
            ))}
            {x.ticks(tickCount).map((tick) => (
              <text key={`x${tick}`} x={x(tick)} y={height - bottom + 16} textAnchor="middle">
                {tick}
              </text>
            ))}
            <text x={width - right} y={height - 4} textAnchor="end">
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
                aria-label={`Week of ${weekText(point.weekStart)}: ${point.sets} hard sets, ${point.intensityPercent.toFixed(0)}%`}
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
              cells: [weekText(point.weekStart), String(point.sets), `${point.intensityPercent.toFixed(1)}%`],
            }))}
          />
        </>
      )}
    </section>
  );
}
