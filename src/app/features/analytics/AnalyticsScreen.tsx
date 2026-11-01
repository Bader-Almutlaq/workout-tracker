import { useSearchParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { Screen } from '../../design/components/Screen';
import { EmptyState } from '../../design/components/EmptyState';
import { analyticsPeriod, type AnalyticsPeriod } from './analyticsPeriod';
import { PeriodChips } from './PeriodChips';
import { AnalyticsDashboard } from './AnalyticsDashboard';

/** One scrolling training dashboard with a URL-persisted period. */
export function AnalyticsScreen() {
  const [params, setParams] = useSearchParams();
  const periods: readonly AnalyticsPeriod[] = ['4W', '12W', '6M', '1Y', 'All'];
  const period = periods.find((item) => item === params.get('period')) ?? '12W';
  const first = useDatabaseQuery('first-finished-workout', () => database.firstFinishedWorkout());
  return (
    <Screen title="Analytics">
      {first.status === 'ready' ? (
        <AnalyticsDashboard
          period={period}
          range={analyticsPeriod(period, new Date(), first.value)}
          onPeriodChange={(value) => {
            const next = new URLSearchParams(params);
            next.set('period', value);
            setParams(next);
          }}
        />
      ) : (
        <>
          <PeriodChips value={period} onChange={() => undefined} />
          <EmptyState message={first.status === 'failed' ? first.message : 'Loading…'} />
        </>
      )}
    </Screen>
  );
}
