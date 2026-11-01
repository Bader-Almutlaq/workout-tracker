import type { DatedValue, TimeAggregation } from '../../../core/analytics/TimeBuckets';
import { TimeChart } from '../../design/charts/TimeChart';
import type { TimeChartMark } from '../../design/charts/TimeChart.types';

/** Applicable timed/bodyweight chart using the common compact and expanded renderer, including empty/single values. */
export function ExerciseChart({
  title,
  points,
  aggregation = 'max',
  formatValue,
  marks,
  unit,
}: {
  readonly title: string;
  readonly marks?: readonly TimeChartMark[];
  readonly points: readonly DatedValue[];
  readonly aggregation?: TimeAggregation;
  readonly formatValue: (value: number) => string;
  readonly unit: string;
}) {
  return (
    <TimeChart
      title={title}
      unit={unit}
      series={[{ name: title, points }]}
      aggregation={aggregation}
      {...(marks === undefined ? {} : { marks })}
      formatValue={formatValue}
    />
  );
}
