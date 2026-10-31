import type { DatedValue, TimeAggregation } from '../../../core/analytics/TimeBuckets';
import { LongRangeChart } from '../../design/charts/LongRangeChart';
import styles from './ExercisePage.module.css';

/** Heuristic: at least two observed sessions are required before showing a trend chart. */
const policy = Object.freeze({ minimumPoints: 2 });

/** An applicable chart, or its one-line insufficient-data note; shared chart retains expand/range/table support. */
export function ExerciseChart({
  title,
  points,
  aggregation = 'max',
  shape = 'line',
  formatValue,
}: {
  readonly title: string;
  readonly points: readonly DatedValue[];
  readonly aggregation?: TimeAggregation;
  readonly shape?: 'line' | 'step';
  readonly formatValue: (value: number) => string;
}) {
  return (
    <section className={styles.chart}>
      <h2 className={styles.heading}>{title}</h2>
      {points.length < policy.minimumPoints ? (
        <p className={styles.note}>{title}: log at least two qualifying sessions to see this chart.</p>
      ) : (
        <LongRangeChart
          title={title}
          series={[{ name: title, points }]}
          aggregation={aggregation}
          shape={shape}
          formatValue={formatValue}
        />
      )}
    </section>
  );
}
