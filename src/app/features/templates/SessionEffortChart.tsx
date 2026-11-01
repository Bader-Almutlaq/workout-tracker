import { useState } from 'react';
import { line } from 'd3-shape';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { ChartFrame } from '../../design/charts/ChartFrame';
import { ChartLayout, chartScales } from '../../design/charts/chartScales';
import { compactTick } from '../../design/charts/compactTick';
import { TouchRule } from '../../design/charts/TouchRule';
import { useChartSize } from '../../design/charts/useChartSize';
import { dayAndTimeText } from '../../format/dateText';
import styles from './TemplateAnalytics.module.css';

type Session = ReturnType<typeof TemplateAnalytics>['perSession'][number];
/** RIR = 10 − RPE (research report §12); marker dimensions follow the shared progress charts. */
const chartSettings = Object.freeze({ maximumRpe: 10, radius: 3, strokeWidth: 2 });

/** Session values retain individual dates, deload markers, accessible selection and a table. */
export function SessionEffortChart({
  sessions,
  effort,
}: {
  readonly sessions: readonly Session[];
  readonly effort: boolean;
}) {
  const { ref, width, height } = useChartSize();
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const title = effort ? 'Effort per session' : 'Hard sets per session';
  const points = sessions.flatMap((session) => {
    const value = effort ? session.averageRir : session.hardSets;
    return value === null ? [] : [{ ...session, value }];
  });
  const tick = (value: number) => `${compactTick(value)} ${effort ? 'RIR' : 'sets'}`;
  const format = (value: number) =>
    effort ? `${value.toFixed(1)} RIR · RPE ${(chartSettings.maximumRpe - value).toFixed(1)}` : `${value} sets`;
  const initial = chartScales(points, width);
  const left = Math.max(
    ChartLayout.padding.left,
    ...initial.gridValues.map((value) => tick(value).length * ChartLayout.labelCharacterWidth + ChartLayout.labelGap),
  );
  const scales = chartScales(points, width, { left });
  const picked = selected === null ? undefined : points[selected];
  const latest = points.at(-1);
  return (
    <section className={styles.chart}>
      <h2>{title}</h2>
      <p>
        {latest
          ? `Latest: ${format(latest.value)}${effort ? ' · lower = harder' : ''}. Each point is one session.`
          : 'No session values yet.'}
      </p>
      {points.length > 0 && (
        <>
          <div ref={ref}>
            <ChartFrame width={width} height={height} scales={scales} label={title} formatTick={tick}>
              <path
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={chartSettings.strokeWidth}
                d={
                  line<(typeof points)[number]>()
                    .x((point) => scales.x(new Date(point.date)))
                    .y((point) => scales.y(point.value))(points) ?? undefined
                }
              />
              {points.map((point) => (
                <circle
                  key={point.workoutId}
                  cx={scales.x(new Date(point.date))}
                  cy={scales.y(point.value)}
                  r={chartSettings.radius}
                  fill={point.isDeload ? 'var(--color-deload)' : 'var(--color-accent)'}
                />
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
          <p aria-live="polite">
            {picked
              ? `${dayAndTimeText(picked.date)} · ${format(picked.value)}${picked.isDeload ? ' · Deload' : ''}`
              : 'Tap a point for its session.'}
          </p>
          {points.some((point) => point.isDeload) && <p>Yellow points: Deload</p>}
        </>
      )}
      <button type="button" onClick={() => setTable(!table)} aria-expanded={table}>
        {table ? 'Hide table' : 'Show as table'}
      </button>
      {table && (
        <div className={styles.tableScroll}>
          <table>
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Session</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.workoutId}>
                  <th scope="row">
                    {dayAndTimeText(point.date)}
                    {point.isDeload ? ' · Deload' : ''}
                  </th>
                  <td>{format(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
