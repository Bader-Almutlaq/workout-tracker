import type { ChartScales } from './chartScales';
import styles from './ClassifiedDots.module.css';

/** Heuristic: DESIGN.md/T-036 uses 6-point dots, an 8-point ring, and intensity from 10% to 50% distance. */
const dotPolicy = Object.freeze({ radius: 3, ringRadius: 4, neutral: 10, saturated: 50, minimumOpacity: 0.45 });

/** Diverging dots for signed percent differences; unavailable comparisons stay neutral. */
export function ClassifiedDots({
  points,
  scales,
}: {
  readonly points: readonly {
    readonly date: string;
    readonly value: number;
    readonly percentDifference: number | null;
    readonly classification: 'below' | 'within' | 'above' | null;
  }[];
  readonly scales: ChartScales;
}) {
  return (
    <g className={styles.palette} aria-hidden>
      {points.map((point, index) => {
        const distance = Math.abs(point.percentDifference ?? 0);
        const opacity =
          point.classification === 'within' || point.classification === null
            ? 1
            : dotPolicy.minimumOpacity +
              (1 - dotPolicy.minimumOpacity) *
                Math.min(1, Math.max(0, (distance - dotPolicy.neutral) / (dotPolicy.saturated - dotPolicy.neutral)));
        return (
          <g
            key={point.date}
            className={
              point.classification === 'below'
                ? styles.below
                : point.classification === 'above'
                  ? styles.above
                  : styles.neutral
            }
          >
            <circle
              cx={scales.x(new Date(point.date))}
              cy={scales.y(point.value)}
              r={dotPolicy.radius}
              fill="currentColor"
              opacity={opacity}
            />
            {index === points.length - 1 && (
              <circle
                className={styles.ring}
                cx={scales.x(new Date(point.date))}
                cy={scales.y(point.value)}
                r={dotPolicy.ringRadius}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
