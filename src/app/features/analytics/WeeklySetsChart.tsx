import { LongRangeChart } from '../../design/charts/LongRangeChart';

/** Weekly sets values; missing values are omitted and deload weeks are marked. */
export function WeeklySetsChart({
  points,
  title = 'Weekly hard sets',
}: {
  readonly points: readonly { readonly date: string; readonly value: number | null; readonly deload: boolean }[];
  readonly title?: string;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <LongRangeChart
        title={title}
        series={[
          {
            name: title,
            points: points.flatMap((point) => (point.value === null ? [] : [{ date: point.date, value: point.value }])),
          },
        ]}
        aggregation="last"
        overviewBucket="week"
        marks={points.filter((point) => point.deload).map((point) => ({ date: point.date, kind: 'deload' }))}
        formatTick={(value) => `${value.toFixed(1)} sets`}
        formatValue={(value) => `${value.toFixed(1)} sets`}
      />
    </section>
  );
}
