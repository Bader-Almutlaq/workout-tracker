import type { WeeklyEffortPoint } from '../../../core/queries/WeeklyEffort';
import { WeeklyChart } from './WeeklyChart';

/** Weekly bars and line share dates but keep independent scales and tables. */
export function WeeklyCharts({ points }: { readonly points: readonly WeeklyEffortPoint[] }) {
  return (
    <>
      <WeeklyChart
        title="Weekly hard sets"
        points={points.map((p) => ({ date: p.weekStart, value: p.hardSets, deload: p.hasDeload }))}
        bars
      />
      <WeeklyChart
        title="Weekly effort"
        points={points.map((p) => ({ date: p.weekStart, value: p.averageRir, deload: p.hasDeload }))}
      />
    </>
  );
}
