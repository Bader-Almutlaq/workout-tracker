import type { WeeklyEffortPoint } from '../../../core/queries/WeeklyEffort';
import { WeeklySetsChart } from './WeeklySetsChart';
import { WeeklyEffortChart } from './WeeklyEffortChart';

/** Weekly bars and line share dates but keep independent scales and tables. */
export function WeeklyCharts({
  points,
  completeHistory = false,
}: {
  readonly points: readonly WeeklyEffortPoint[];
  readonly completeHistory?: boolean;
}) {
  async function loadHistory(effort: boolean) {
    // Deferred so ordinary page rendering does not load another copy of the report.
    const { database } = await import('../../data/database');
    const first = await database.firstFinishedWorkout();
    const history = first === null ? [] : await database.weeklyEffort(first, new Date().toISOString());
    const name = effort ? 'Weekly effort' : 'Weekly hard sets';
    return [
      {
        name,
        points: history.map((point) => ({
          date: point.weekStart,
          value: effort ? point.averageRir : point.hardSets,
          deload: point.hasDeload,
        })),
      },
    ];
  }
  return (
    <>
      <WeeklySetsChart
        {...(completeHistory ? {} : { loadHistory: () => loadHistory(false) })}
        points={points.map((p) => ({ date: p.weekStart, value: p.hardSets, deload: p.hasDeload }))}
      />
      <WeeklyEffortChart
        {...(completeHistory ? {} : { loadHistory: () => loadHistory(true) })}
        points={points.map((p) => ({ date: p.weekStart, value: p.averageRir, deload: p.hasDeload }))}
      />
    </>
  );
}
