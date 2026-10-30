import { curveCatmullRom, line } from 'd3-shape';
import type { ChartPoint, ChartScales } from './chartScales';
import styles from './ComparisonLines.module.css';

/** Two same-unit series: a thick recent curve and a quiet baseline, without recomputing values. */
export function ComparisonLines({
  recent,
  baseline,
  scales,
}: {
  readonly recent: readonly ChartPoint[];
  readonly baseline: readonly ChartPoint[];
  readonly scales: ChartScales;
}) {
  const path = line<ChartPoint>()
    .x((point) => scales.x(new Date(point.date)))
    .y((point) => scales.y(point.value))
    .curve(curveCatmullRom);
  return (
    <g aria-hidden>
      <path className={styles.baseline} d={path(baseline) ?? undefined} />
      <path className={styles.recent} d={path(recent) ?? undefined} />
    </g>
  );
}
