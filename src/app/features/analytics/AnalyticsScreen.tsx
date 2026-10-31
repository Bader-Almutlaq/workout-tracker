import { useSearchParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { Screen } from '../../design/components/Screen';
import { EmptyState } from '../../design/components/EmptyState';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { AnalyticsOverview } from './AnalyticsOverview';
import { AnalyticsMuscles } from './AnalyticsMuscles';
import { analyticsPeriod, type AnalyticsPeriod } from './analyticsPeriod';
import { PeriodChips } from './PeriodChips';
import styles from './Analytics.module.css';

/** Analytics views and shared period are persisted in the URL. */
export function AnalyticsScreen() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'muscles' ? 'muscles' : 'overview';
  const periods: readonly AnalyticsPeriod[] = ['4W', '12W', '6M', '1Y', 'All'];
  const period = periods.find((item) => item === params.get('period')) ?? '12W';
  const first = useDatabaseQuery('first-finished-workout', () => database.firstFinishedWorkout());
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  };
  return (
    <Screen title="Analytics">
      <div className={styles.controls}>
        <SegmentedControl
          label="Analytics views"
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'muscles', label: 'Muscles' },
          ]}
          value={view}
          onChange={(value) => set('view', value)}
        />
        <PeriodChips value={period} onChange={(value) => set('period', value)} />
      </div>
      {first.status === 'loading' && <EmptyState message="Loading…" />}
      {first.status === 'failed' && <EmptyState message={first.message} />}
      {first.status === 'ready' &&
        (() => {
          const range = analyticsPeriod(period, new Date(), first.value);
          return view === 'overview' ? (
            <AnalyticsOverview
              from={range.from}
              to={range.to}
              previousFrom={range.previous?.from ?? null}
              weeks={range.weeks}
            />
          ) : (
            <AnalyticsMuscles from={range.from} to={range.to} />
          );
        })()}
    </Screen>
  );
}
