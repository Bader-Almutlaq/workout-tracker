import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { analyticsPeriod, type AnalyticsPeriod } from './analyticsPeriod';
import { PeriodChips } from './PeriodChips';
import { PinnedLifts } from './PinnedLifts';
import { ActivePlanRow } from './ActivePlanRow';
import { SummaryTiles } from './SummaryTiles';
import { StrengthSection } from './StrengthSection';
import { MuscleDashboardTable } from './MuscleDashboardTable';
import { EffortAndReps } from './EffortAndReps';

/** The ordered sections of the Analytics tab. */
export function AnalyticsDashboard({
  period,
  range,
  onPeriodChange,
}: {
  readonly period: AnalyticsPeriod;
  readonly range: ReturnType<typeof analyticsPeriod>;
  readonly onPeriodChange: (period: AnalyticsPeriod) => void;
}) {
  const start = range.from.toISOString();
  const end = range.to.toISOString();
  const last = new Date(range.to.getTime() - 1).toISOString();
  const prior = range.previous?.from.toISOString() ?? null;
  const query = useDatabaseQuery(`dashboard-${start}-${end}`, async () => {
    const [overview, ranking, muscles, mix, effort] = await Promise.all([
      database.analyticsOverview(start, end, prior),
      database.strengthRanking(start, end),
      database.muscleDashboard(start, last),
      database.intensityMix(start, last),
      database.weeklyEffort(start, last),
    ]);
    return { overview, ranking, muscles, mix, effort };
  });
  return (
    <>
      <PinnedLifts from={start} to={end} />
      <ActivePlanRow />
      <PeriodChips value={period} onChange={onPeriodChange} />
      {query.status === 'ready' ? (
        <>
          <h2>Overview</h2>
          <SummaryTiles
            current={query.value.overview.current}
            previous={query.value.overview.previous}
            weeks={range.weeks}
          />
          <StrengthSection ranking={query.value.ranking} weeks={range.weeks} />
          <MuscleDashboardTable muscles={query.value.muscles} period={period} />
          <EffortAndReps mix={query.value.mix} effort={query.value.effort} />
        </>
      ) : (
        <EmptyState message={query.status === 'failed' ? query.message : 'Loading…'} />
      )}
    </>
  );
}
