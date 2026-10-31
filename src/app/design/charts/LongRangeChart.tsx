import { useState } from 'react';
import type { DatedValue, TimeAggregation, TimeBucketSize } from '../../../core/analytics/TimeBuckets';
import { LongRangePlot } from './LongRangePlot';
import { LongRangeChartSheet } from './LongRangeChartSheet';
import styles from './LongRangeChart.module.css';

/** One named series in display units; paired measurements remain independent series. */
export interface LongRangeSeries {
  readonly name: string;
  readonly points: readonly DatedValue[];
}

/** A dated session annotation; optional so unrelated chart callers retain their existing appearance. */
export interface LongRangeMark {
  readonly date: string;
  readonly kind: 'deload';
}

/** Reusable chart inputs; the caller selects the aggregation and formats values in its own units. */
export interface LongRangeChartProps {
  readonly title: string;
  readonly series: readonly LongRangeSeries[];
  readonly aggregation: TimeAggregation;
  /** Session annotations bucketed with the same calendar/range as the observations. */
  readonly marks?: readonly LongRangeMark[];
  /** Optional overview period, e.g. weekly session totals; expanded charts still use finer automatic detail. */
  readonly overviewBucket?: TimeBucketSize;
  /** Line interpolation; defaults to straight segments. */
  readonly shape?: 'line' | 'step';
  /** Optional y-axis formatter; defaults to compact numbers. */
  readonly formatTick?: (value: number) => string;
  readonly formatValue: (value: number) => string;
}

/** Aggregated overview that opens a full-screen chart with finer periods, range chips, touch readouts and tables. */
export function LongRangeChart(props: LongRangeChartProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className={styles.stack} aria-label={props.title}>
      <LongRangePlot {...props} onExpand={() => setExpanded(true)} />
      {expanded && <LongRangeChartSheet {...props} onClose={() => setExpanded(false)} />}
    </section>
  );
}
