import { line } from 'd3-shape';
import type { TimeChartModel } from './timeChartModel';
import { TimeChartPolicy, type TimeChartBucket } from './timeChartMath';
import styles from './TimeChart.module.css';

/** Same-unit lines/bars and optional regression, with small yellow deload points at every resolution. */
export function TimeChartMarks({
  model,
  kind,
  selected,
}: {
  readonly model: TimeChartModel;
  readonly kind: 'line' | 'bars';
  readonly selected: string | null;
}) {
  const { scales } = model;
  const path = line<TimeChartBucket>()
    .x((point) => scales.x(new Date(point.date)))
    .y((point) => scales.y(point.value ?? 0));
  const centers = model.dates.map((date) => scales.x(new Date(date)));
  const spacing = centers
    .slice(1)
    .reduce(
      (minimum, center, index) => Math.min(minimum, center - (centers[index] ?? center)),
      scales.right - scales.left,
    );
  const barWidth = Math.min(
    TimeChartPolicy.maximumBarWidth,
    (spacing * TimeChartPolicy.barFraction) / Math.max(1, model.series.length),
  );
  return (
    <g>
      {model.series.map((item, index) => (
        <g key={item.name} className={styles.series} data-series={index}>
          {kind === 'line' &&
            item.segments.map((segment, segmentIndex) => (
              <path key={segmentIndex} className={styles.line} d={path(segment) ?? undefined} />
            ))}
          {item.trend.length > 0 && (
            <path
              className={styles.trend}
              data-trend
              d={
                line<{ readonly date: string; readonly value: number }>()
                  .x((point) => scales.x(new Date(point.date)))
                  .y((point) => scales.y(point.value))(item.trend) ?? undefined
              }
            />
          )}
          {item.points.map((point) => {
            if (point.value === null) return null;
            const x = scales.x(new Date(point.date));
            const y = scales.y(point.value);
            const markX = kind === 'bars' ? x + (index - (model.series.length - 1) / 2) * barWidth : x;
            return (
              <g key={point.date}>
                {kind === 'bars' ? (
                  <rect
                    className={`${styles.bar} ${point.deload ? styles.deload : ''}`}
                    aria-label={point.deload ? 'Deload' : undefined}
                    x={markX - barWidth / 2}
                    y={Math.min(scales.y(0), y)}
                    width={barWidth}
                    height={Math.abs(scales.y(0) - y)}
                  />
                ) : (
                  <circle
                    className={`${styles.dot} ${point.deload ? styles.deload : ''}`}
                    aria-label={point.deload ? 'Deload' : undefined}
                    cx={markX}
                    cy={y}
                    r={TimeChartPolicy.dotRadius}
                  />
                )}
                {selected === point.date && (
                  <circle
                    className={`${styles.ring} ${point.deload ? styles.deload : ''}`}
                    cx={markX}
                    cy={y}
                    r={TimeChartPolicy.ringRadius}
                  />
                )}
              </g>
            );
          })}
        </g>
      ))}
      {selected !== null && (
        <line
          className={styles.rule}
          x1={scales.x(new Date(selected))}
          x2={scales.x(new Date(selected))}
          y1={scales.top}
          y2={scales.bottom}
        />
      )}
    </g>
  );
}
