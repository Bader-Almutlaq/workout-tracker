import type { TimeAggregation } from '../../../core/analytics/TimeBuckets';
import { useNavigate } from 'react-router';
import type { ExerciseProgressSession } from '../../../core/queries/ExerciseProgress';
import { TimeChart } from '../../design/charts/TimeChart';

/** One plotted session in display units; missing values preserve explicit gaps. */
export interface ProgressChartPoint {
  readonly date: string;
  readonly value: number | null;
  readonly session: ExerciseProgressSession;
}

/** A named exercise/workout line with independent dated session values. */
export interface ProgressChartSeries {
  readonly name: string;
  readonly points: readonly ProgressChartPoint[];
}

/** Adapts exercise session data to the shared chart; session navigation is available only after expansion. */
export function ExerciseProgressChart({
  title,
  series,
  formatValue,
  unit,
  kind = 'line',
  trend = false,
  aggregation,
}: {
  readonly title: string;
  readonly series: readonly ProgressChartSeries[];
  readonly formatValue: (value: number) => string;
  readonly unit: string;
  readonly kind?: 'line' | 'bars';
  readonly trend?: boolean;
  readonly aggregation?: TimeAggregation;
}) {
  const navigate = useNavigate();
  return (
    <TimeChart
      title={title}
      unit={unit}
      series={series.map((item) => ({
        name: item.name,
        points: item.points.map((point) => ({
          date: point.date,
          value: point.value,
          sessionId: point.session.workoutId,
          deload: point.session.isDeload,
        })),
      }))}
      aggregation={aggregation ?? (kind === 'bars' ? 'sum' : 'max')}
      kind={kind}
      trend={trend}
      formatValue={formatValue}
      onOpenPoint={(point) => {
        if (point.sessionId !== undefined) void navigate(`/history/${point.sessionId}`);
      }}
    />
  );
}
