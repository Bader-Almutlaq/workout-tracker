import type { ChartPoint, ChartScales } from './chartScales';
import styles from './ChartFrame.module.css';

/** Heuristic: 7-point session dots and a 10-point ring keep the latest session visible on a phone. */
const dotSize = Object.freeze({ radius: 3.5, latestRadius: 5 });

/** Quiet raw observations; the final observation receives an opaque accent ring. */
export function DotSeries({
  points,
  scales,
}: {
  readonly points: readonly ChartPoint[];
  readonly scales: ChartScales;
}) {
  return (
    <g aria-hidden>
      {points.map((point, index) => (
        <circle
          key={point.date}
          className={index === points.length - 1 ? styles.ring : styles.dot}
          cx={scales.x(new Date(point.date))}
          cy={scales.y(point.value)}
          r={index === points.length - 1 ? dotSize.latestRadius : dotSize.radius}
        />
      ))}
    </g>
  );
}
