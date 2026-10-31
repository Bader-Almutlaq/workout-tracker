import { useState } from 'react';
import { area, curveLinear, curveStepAfter, line } from 'd3-shape';
import {
  TimeBuckets,
  type TimeAggregation,
  type TimeBucketSize,
  type TimeBucket,
  type TimeRange,
} from '../../../core/analytics/TimeBuckets';
import { FORMAT_LOCALE } from '../../format/formatLocale';
import { ChartFrame } from './ChartFrame';
import { ChartTable } from './ChartTable';
import { TouchRule } from './TouchRule';
import { chartScales } from './chartScales';
import { useChartSize } from './useChartSize';
import type { LongRangeChartProps } from './LongRangeChart';
import styles from './LongRangeChart.module.css';

/** Plain words for the bucket and aggregation, e.g. "Monthly average" or "Weekly best". */
function periodCaption(size: TimeBucketSize, aggregation: TimeAggregation): string {
  const period = size === 'day' ? 'Daily' : size === 'week' ? 'Weekly' : 'Monthly';
  if (aggregation === 'sum') return `${period} total`;
  if (size === 'day')
    return aggregation === 'last' ? 'Each entry' : `${period} ${aggregation === 'mean' ? 'average' : 'best'}`;
  return `${period} ${aggregation === 'mean' ? 'average' : aggregation === 'max' ? 'best' : 'last value'}`;
}

/** Heuristic: small marks keep period values and single-bucket spreads visible without overpowering the line. */
const plotMarks = Object.freeze({ dotRadius: 2, spreadHalfWidth: 3, deloadHalfWidth: 8 });

const dateFormat = new Intl.DateTimeFormat(FORMAT_LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/** Shared small/full plot: all aggregation is delegated to WorkoutCore; SVG only maps returned values to pixels. */
export function LongRangePlot({
  title,
  series,
  aggregation,
  overviewBucket,
  formatValue,
  shape = 'line',
  marks,
  height: requestedHeight,
  range = 'all',
  detailed = false,
  onExpand,
}: LongRangeChartProps & {
  readonly height?: number;
  readonly range?: TimeRange;
  readonly detailed?: boolean;
  readonly onExpand?: () => void;
}) {
  const { ref, width, height } = useChartSize(requestedHeight);
  const [selected, setSelected] = useState<number | null>(null);
  const shown = TimeBuckets.range(
    series.flatMap((item) => item.points),
    range,
  );
  const size =
    !detailed && overviewBucket !== undefined
      ? overviewBucket
      : shown === null
        ? 'day'
        : TimeBuckets.choose(shown.from, shown.to, detailed);
  const buckets = series.map((item) => ({
    name: item.name,
    buckets: TimeBuckets.aggregate(item.points, size, aggregation, shown ?? undefined),
  }));
  const observations = buckets
    .flatMap((item) => item.buckets.map((bucket) => ({ ...bucket, name: item.name, date: bucket.start })))
    .toSorted((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const scales = chartScales(
    aggregation === 'sum'
      ? observations
      : observations.flatMap((point) => [
          point,
          { date: point.date, value: point.min },
          { date: point.date, value: point.max },
        ]),
    width,
    { zeroBaseline: aggregation === 'sum', height },
  );
  const singleBucket = observations[0]?.date === observations.at(-1)?.date;
  if (shown !== null && !(range === 'all' && singleBucket)) {
    const firstBucket = observations[0]?.date ?? shown.from;
    const from = Math.min(Date.parse(firstBucket), Date.parse(shown.from));
    const to = Date.parse(shown.to);
    // Keep the shared scale's padded domain only when the shown window is a single instant.
    if (from !== to) scales.x.domain([new Date(from), new Date(to)]);
  }
  const deloadBuckets = new Set(
    TimeBuckets.aggregate(
      (marks ?? []).filter((mark) => mark.kind === 'deload').map((mark) => ({ date: mark.date, value: 1 })),
      size,
      'sum',
      shown ?? undefined,
    ).map((bucket) => bucket.start),
  );
  const markedStarts = [...new Set(observations.map((point) => point.start))].filter((start) =>
    deloadBuckets.has(start),
  );
  const picked = selected === null ? undefined : observations[selected];
  const readout =
    picked === undefined
      ? 'Touch and drag for values'
      : `${dateFormat.format(new Date(picked.start))} · ${observations
          .filter((point) => point.start === picked.start)
          .map(
            (point) =>
              `${point.name}: ${formatValue(point.value)} (min ${formatValue(point.min)}, max ${formatValue(point.max)}; ${point.count} entries)`,
          )
          .join(' · ')}${deloadBuckets.has(picked.start) ? ' · Deload' : ''}`;
  const plot = (
    <ChartFrame width={width} height={height} scales={scales} label={title}>
      {markedStarts.map((start) => {
        const center = scales.x(new Date(start));
        const left = Math.max(scales.left, center - plotMarks.deloadHalfWidth);
        const right = Math.min(scales.right, center + plotMarks.deloadHalfWidth);
        return (
          <rect
            key={start}
            className={styles.deloadColumn}
            x={left}
            y={scales.top}
            width={right - left}
            height={scales.bottom - scales.top}
          />
        );
      })}
      {buckets.map((item, index) => {
        const band = area<TimeBucket>()
          .x((point) => scales.x(new Date(point.start)))
          .y0((point) => scales.y(point.min))
          .y1((point) => scales.y(point.max))(item.buckets);
        const path = line<TimeBucket>()
          .x((point) => scales.x(new Date(point.start)))
          .y((point) => scales.y(point.value))
          .curve(shape === 'step' ? curveStepAfter : curveLinear)(item.buckets);
        return (
          <g key={item.name} className={index === 0 ? styles.primary : styles.secondary}>
            {aggregation !== 'sum' && item.buckets.some((point) => point.count > 1) && (
              <path className={styles.band} d={band ?? undefined} />
            )}
            {aggregation !== 'sum' &&
              item.buckets.length === 1 &&
              item.buckets.map(
                (point) =>
                  point.count > 1 && (
                    <rect
                      key={point.start}
                      className={styles.band}
                      x={scales.x(new Date(point.start)) - plotMarks.spreadHalfWidth}
                      y={scales.y(point.max)}
                      width={plotMarks.spreadHalfWidth * 2}
                      height={scales.y(point.min) - scales.y(point.max)}
                    />
                  ),
              )}
            <path className={styles.line} d={path ?? undefined} />
            {item.buckets.map((point) => (
              <circle
                key={point.start}
                className={deloadBuckets.has(point.start) ? styles.deloadDot : styles.dot}
                aria-label={deloadBuckets.has(point.start) ? 'Deload' : undefined}
                cx={scales.x(new Date(point.start))}
                cy={scales.y(point.value)}
                r={plotMarks.dotRadius}
              />
            ))}
          </g>
        );
      })}
      {detailed && (
        <TouchRule
          points={observations}
          scales={scales}
          selectedIndex={selected}
          onSelect={setSelected}
          label={`${title}; drag or use arrow keys`}
        />
      )}
    </ChartFrame>
  );
  return (
    <div className={styles.stack}>
      <p className={styles.caption}>{periodCaption(size, aggregation)}</p>
      {series.length > 1 && (
        <div className={styles.legend}>
          {series.map((item, index) => (
            <span key={item.name} className={index === 0 ? styles.primary : styles.secondary}>
              {item.name}
            </span>
          ))}
        </div>
      )}
      {detailed && (
        <p className={styles.readout} aria-live="polite">
          {readout}
        </p>
      )}
      <div ref={ref}>
        {observations.length === 0 ? (
          <p className={styles.caption}>No data in this range.</p>
        ) : onExpand === undefined ? (
          plot
        ) : (
          <button type="button" className={styles.expand} onClick={onExpand} aria-label={`Open ${title} full screen`}>
            {plot}
            <span>Tap to expand</span>
          </button>
        )}
      </div>
      {markedStarts.length > 0 && <p className={styles.caption}>Hollow points and yellow shading: Deload</p>}
      <ChartTable
        caption={`${title} · ${periodCaption(size, aggregation)}`}
        columns={['Period start', 'Series', 'Value', 'Min', 'Max', 'Count', ...(marks === undefined ? [] : ['Notes'])]}
        rows={observations.map((point) => ({
          key: `${point.name}-${point.start}`,
          cells: [
            dateFormat.format(new Date(point.start)),
            point.name,
            formatValue(point.value),
            formatValue(point.min),
            formatValue(point.max),
            String(point.count),
            ...(marks === undefined ? [] : [deloadBuckets.has(point.start) ? 'Deload' : '']),
          ],
        }))}
      />
    </div>
  );
}
