import type { TimeChartProps } from '../../design/charts/TimeChart.types';
import { TimeChart } from '../../design/charts/TimeChart';

/** Weekly logged effort in RIR, preserving missing weeks and deload annotations. */
export function WeeklyEffortChart({
  points,
  title = 'Weekly effort',
  loadHistory,
}: {
  readonly points: readonly { readonly date: string; readonly value: number | null; readonly deload: boolean }[];
  readonly title?: string;
  readonly loadHistory?: TimeChartProps['loadHistory'];
}) {
  return (
    <TimeChart
      title={title}
      {...(loadHistory === undefined ? {} : { loadHistory })}
      unit="RIR"
      aggregation="mean"
      series={[{ name: title, points }]}
      formatValue={(value) => `${value.toFixed(1)} RIR`}
    />
  );
}
