import { useState } from 'react';
import type { DatedValue, TimeAggregation } from '../../../core/analytics/TimeBuckets';
import { LongRangePlot } from './LongRangePlot';
import { LongRangeChartSheet } from './LongRangeChartSheet';
import styles from './LongRangeChart.module.css';

/** One named series in display units; paired measurements remain independent series. */
export interface LongRangeSeries {
  readonly name: string;
  readonly points: readonly DatedValue[];
}

/** Reusable chart inputs; the caller selects the aggregation and formats values in its own units. */
export interface LongRangeChartProps {
  readonly title: string;
  readonly series: readonly LongRangeSeries[];
  readonly aggregation: TimeAggregation;
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
