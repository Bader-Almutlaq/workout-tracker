import { compactTick } from '../../design/charts/compactTick';
import { LongRangeChart } from '../../design/charts/LongRangeChart';

/** Weekly RIR values; missing values are omitted and deload weeks are marked. */
export function WeeklyEffortChart({
  points,
  title = 'Weekly effort',
}: {
  readonly points: readonly { readonly date: string; readonly value: number | null; readonly deload: boolean }[];
  readonly title?: string;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <p>Lower = harder.</p>
      <LongRangeChart
        title={title}
        series={[
          {
            name: title,
            points: points.flatMap((point) => (point.value === null ? [] : [{ date: point.date, value: point.value }])),
          },
        ]}
        aggregation="mean"
        overviewBucket="week"
        marks={points.filter((point) => point.deload).map((point) => ({ date: point.date, kind: 'deload' }))}
        formatTick={(value) => `${compactTick(value)} RIR`}
        formatValue={(value) => `${value.toFixed(1)} RIR`}
      />
    </section>
  );
}
