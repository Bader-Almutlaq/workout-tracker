import type { TimeChartProps } from '../../design/charts/TimeChart.types';
import { TimeChart } from '../../design/charts/TimeChart';

/** Weekly totals drawn as zero-based bars; null weeks stay gaps and regression excludes deload observations. */
export function WeeklySetsChart({
  points,
  title = 'Weekly hard sets',
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
      unit="sets"
      kind="bars"
      trend
      aggregation="sum"
      series={[{ name: title, points }]}
      formatValue={(value) => `${value.toFixed(1)} sets`}
    />
  );
}
