import { compactTick } from '../../design/charts/compactTick';
import { LongRangeChart } from '../../design/charts/LongRangeChart';

/** RIR = 10 − RPE (research report §12). */
const maximumRpe = 10;

/** Weekly RIR values; missing values are omitted and deload weeks are marked. */
export function WeeklyEffortChart({
  points,
  title = 'Weekly effort',
}: {
  readonly points: readonly { readonly date: string; readonly value: number | null; readonly deload: boolean }[];
  readonly title?: string;
}) {
  const latest = points.at(-1)?.value;
  return (
    <section>
      <h2>{title}</h2>
      <p>
        {latest === null || latest === undefined
          ? 'No logged effort in the latest week.'
          : `Latest week: ${latest.toFixed(1)} RIR · RPE ${(maximumRpe - latest).toFixed(1)}. Lower = harder.`}
        {' Each point is one week.'}
      </p>
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
