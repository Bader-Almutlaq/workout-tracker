import { useState } from 'react';
import { line } from 'd3-shape';
import { Link } from 'react-router';
import type { ExerciseProgressSession } from '../../../core/queries/ExerciseProgress';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { ChartFrame } from '../../design/charts/ChartFrame';
import { ChartLayout, chartScales } from '../../design/charts/chartScales';
import { useChartSize } from '../../design/charts/useChartSize';
import { TouchRule } from '../../design/charts/TouchRule';
import { dayAndTimeText } from '../../format/dateText';
import { progressTopSetText } from './progressText';
import styles from './ExerciseProgress.module.css';
import palette from '../../design/charts/ProgressPalette.module.css';

/** One plotted session with an unrounded numeric value; dates preserve separate same-day sessions. */
export interface ProgressChartPoint {
  readonly date: string;
  readonly value: number;
  readonly session: ExerciseProgressSession;
}

/** A named exercise/workout line; points arrive chronologically in the chart's display units. */
export interface ProgressChartSeries {
  readonly name: string;
  readonly points: readonly ProgressChartPoint[];
}

/** Heuristic: quiet session markers and thin lines remain legible on a phone; at most three categorical series. */
const geometry = Object.freeze({ radius: 3, strokeWidth: 2 });

/** Per-session plot using shared axes/touch math, persistent session readout, and an accessible table with session links. */
export function ExerciseProgressChart({
  title,
  takeaway,
  series,
  formatValue,
  unit,
  bodyweight,
}: {
  readonly title: string;
  readonly takeaway: string;
  readonly series: readonly ProgressChartSeries[];
  readonly formatValue: (value: number) => string;
  readonly unit: WeightUnit;
  readonly bodyweight: boolean;
}) {
  const { ref, width, height } = useChartSize();
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const points = series
    .flatMap((item) => item.points.map((point) => ({ ...point, name: item.name })))
    .toSorted((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const initial = chartScales(points, width);
  const left = Math.max(
    ChartLayout.padding.left,
    ...initial.gridValues.map(
      (value) => formatValue(value).length * ChartLayout.labelCharacterWidth + ChartLayout.labelGap,
    ),
  );
  const scales = chartScales(points, width, { left });
  const picked = selected === null ? undefined : points[selected];
  return (
    <section className={`${styles.chart} ${palette.colors}`}>
      <h2>{title} · each point is one session</h2>
      <p className={styles.note}>{takeaway}</p>
      {series.length > 1 && (
        <ul className={styles.legend} aria-label="Series legend">
          {series.map((item, index) => (
            <li key={item.name} data-series={index}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
      {points.length === 0 ? (
        <p>No qualifying sessions yet.</p>
      ) : (
        <>
          <div ref={ref}>
            <ChartFrame width={width} height={height} scales={scales} label={title} formatTick={formatValue}>
              {series.map((item, index) => (
                <g key={item.name} className={styles.series} data-series={index}>
                  <path
                    fill="none"
                    strokeWidth={geometry.strokeWidth}
                    d={
                      line<ProgressChartPoint>()
                        .x((point) => scales.x(new Date(point.date)))
                        .y((point) => scales.y(point.value))(item.points) ?? undefined
                    }
                  />
                  {item.points.map((point) => (
                    <circle
                      key={point.session.workoutId}
                      className={point.session.isDeload ? styles.deload : undefined}
                      aria-label={point.session.isDeload ? 'Deload' : undefined}
                      cx={scales.x(new Date(point.date))}
                      cy={scales.y(point.value)}
                      r={geometry.radius}
                    />
                  ))}
                </g>
              ))}
              <TouchRule
                points={points}
                scales={scales}
                selectedIndex={selected}
                onSelect={(index) => {
                  if (index !== null) setSelected(index);
                }}
                label={`${title}; touch or use arrow keys for session`}
              />
            </ChartFrame>
          </div>
          <p aria-live="polite" className={styles.readout}>
            {picked === undefined ? (
              'Tap a point for its session.'
            ) : (
              <>
                {picked.name} · {dayAndTimeText(picked.date)} · {formatValue(picked.value)} ·{' '}
                {progressTopSetText(picked.session.topSet, unit, bodyweight)}
                {picked.session.isDeload ? ' · Deload' : ''} ·{' '}
                <Link to={`/history/${picked.session.workoutId}`}>Open session</Link>
              </>
            )}
          </p>
          {points.some((point) => point.session.isDeload) && (
            <p className={styles.note}>Yellow points: Deload · excluded from changes</p>
          )}
        </>
      )}
      <button type="button" aria-expanded={table} onClick={() => setTable(!table)}>
        {table ? 'Hide table' : 'Show as table'}
      </button>
      {table && (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Session</th>
                <th scope="col">Workout</th>
                <th scope="col">Value</th>
                <th scope="col">Top set</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={`${point.name}-${point.session.workoutId}`}>
                  <th scope="row">
                    <Link to={`/history/${point.session.workoutId}`}>{dayAndTimeText(point.date)}</Link>
                    {point.session.isDeload ? ' · Deload' : ''}
                  </th>
                  <td>{point.name}</td>
                  <td>{formatValue(point.value)}</td>
                  <td>{progressTopSetText(point.session.topSet, unit, bodyweight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
