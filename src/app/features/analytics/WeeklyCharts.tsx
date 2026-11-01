import type { WeeklyEffortPoint } from '../../../core/queries/WeeklyEffort';
import { WeeklySetsChart } from './WeeklySetsChart';
import { WeeklyEffortChart } from './WeeklyEffortChart';

/** Weekly bars and line share dates but keep independent scales and tables. */
export function WeeklyCharts({ points }: { readonly points: readonly WeeklyEffortPoint[] }) {
  return (
    <>
      <WeeklySetsChart points={points.map((p) => ({ date: p.weekStart, value: p.hardSets, deload: p.hasDeload }))} />
      <WeeklyEffortChart
        points={points.map((p) => ({ date: p.weekStart, value: p.averageRir, deload: p.hasDeload }))}
      />
    </>
  );
}
