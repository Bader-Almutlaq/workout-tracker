import { useState } from 'react';
import { line } from 'd3-shape';
import type { TemplateAnalytics } from '../../../core/queries/TemplateAnalytics';
import { dayAndTimeText } from '../../format/dateText';
import styles from './TemplateAnalytics.module.css';

type Session = ReturnType<typeof TemplateAnalytics>['perSession'][number];
/** Heuristic: fixed viewbox and zero baseline keep per-session bars readable on a phone. */
const geometry = Object.freeze({ width: 600, height: 160, top: 10, bottom: 140, barWidth: 16, maximumRpe: 10 });
/** One mark per session with dated selection, deload color and a table alternative. */
export function SessionEffortChart({
  sessions,
  effort,
}: {
  readonly sessions: readonly Session[];
  readonly effort: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const title = effort ? 'Effort per session' : 'Hard sets per session';
  const points = sessions.flatMap((session) => {
    const value = effort ? session.averageRir : session.hardSets;
    return value === null ? [] : [{ ...session, value }];
  });
  const max = Math.max(1, ...points.map((point) => point.value));
  const x = (index: number) => ((index + 0.5) * geometry.width) / Math.max(1, points.length);
  const y = (value: number) => geometry.bottom - (value / max) * (geometry.bottom - geometry.top);
  const format = (value: number) =>
    effort ? `${value.toFixed(1)} RIR · RPE ${(geometry.maximumRpe - value).toFixed(1)}` : `${value} sets`;
  const picked = selected === null ? undefined : points[selected];
  const latest = points.at(-1);
  return (
    <section className={styles.chart}>
      <h2>
        {title} · each {effort ? 'point' : 'bar'} is one session
      </h2>
      <p>{latest ? `Latest: ${format(latest.value)}${effort ? ' · lower = harder' : ''}` : 'No logged effort yet.'}</p>
      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={title}>
        {effort && (
          <path
            d={
              line<(typeof points)[number]>()
                .x((_, index) => x(index))
                .y((point) => y(point.value))(points) ?? ''
            }
            fill="none"
            stroke="var(--color-accent)"
          />
        )}
        {points.map((point, index) => (
          <g
            key={point.workoutId}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setSelected(index);
            }}
            role="button"
            tabIndex={0}
            aria-label={`${dayAndTimeText(point.date)} · ${format(point.value)}${point.isDeload ? ' · Deload' : ''}`}
          >
            {effort ? (
              <circle
                cx={x(index)}
                cy={y(point.value)}
                r="6"
                fill={point.isDeload ? 'var(--color-deload)' : 'var(--color-accent)'}
              />
            ) : (
              <rect
                x={x(index) - geometry.barWidth / 2}
                y={y(point.value)}
                width={Math.min(geometry.barWidth, geometry.width / Math.max(1, points.length))}
                height={geometry.bottom - y(point.value)}
                fill={point.isDeload ? 'var(--color-deload)' : 'var(--color-accent)'}
              />
            )}
          </g>
        ))}
      </svg>
      <p aria-live="polite">
        {picked
          ? `${dayAndTimeText(picked.date)} · ${format(picked.value)}${picked.isDeload ? ' · Deload' : ''}`
          : 'Tap a mark for its session.'}
      </p>
      {points.some((point) => point.isDeload) && <p>Yellow: Deload</p>}
      <button type="button" onClick={() => setTable(!table)} aria-expanded={table}>
        {table ? 'Hide table' : 'Show as table'}
      </button>
      {table && (
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th>Session</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.workoutId}>
                <td>
                  {dayAndTimeText(point.date)}
                  {point.isDeload ? ' · Deload' : ''}
                </td>
                <td>{format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
