import { curveMonotoneX, line } from 'd3-shape';
import type { ChartPoint, ChartScales } from './chartScales';
import styles from './ChartFrame.module.css';

/** Two-point accent stroke through supplied trend values; no smoothing or analytics are recomputed. */
export function TrendLine({
  points,
  scales,
}: {
  readonly points: readonly ChartPoint[];
  readonly scales: ChartScales;
}) {
  const path = line<ChartPoint>()
    .x((point) => scales.x(new Date(point.date)))
    .y((point) => scales.y(point.value))
    .curve(curveMonotoneX)(points);
  return <path className={styles.trend} d={path ?? undefined} />;
}
