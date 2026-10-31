import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { LongRangeChart } from '../../design/charts/LongRangeChart';
import { SignatureCard } from './SignatureCard';
import { SummaryTiles } from './SummaryTiles';
import { LiftTrendList } from './LiftTrendList';
import { VolumePeriods } from './volumeLayout';
import styles from './Analytics.module.css';

/** Training totals, session frequency and lift trends for the selected period. */
export function AnalyticsOverview({
  from,
  to,
  previousFrom,
  weeks,
}: {
  readonly from: Date;
  readonly to: Date;
  readonly previousFrom: Date | null;
  readonly weeks: number;
}) {
  const start = from.toISOString();
  const end = to.toISOString();
  const prior = previousFrom?.toISOString() ?? null;
  const query = useDatabaseQuery(`overview-${start}-${end}-${prior}`, () =>
    database.analyticsOverview(start, end, prior),
  );
  if (query.status === 'loading') return <EmptyState message="Loading…" />;
  if (query.status === 'failed') return <EmptyState message={query.message} />;
  const { current, previous, lifts } = query.value;
  const emptyWeeks: { date: string; value: number }[] = [];
  for (const week = new Date(from); week < to; week.setDate(week.getDate() + VolumePeriods.daysPerWeek)) {
    emptyWeeks.push({ date: week.toISOString(), value: 0 });
  }
  if (current.workouts.length === 0) return <EmptyState message="No workouts in this period." />;
  return (
    <>
      <SummaryTiles current={current} previous={previous} weeks={weeks} />
      <SignatureCard />
      <LongRangeChart
        title="Workouts per week"
        series={[
          {
            name: 'Workouts',
            points: [...emptyWeeks, ...current.workouts.map((workout) => ({ date: workout.date, value: 1 }))],
          },
        ]}
        aggregation="sum"
        overviewBucket="week"
        marks={current.workouts
          .filter((workout) => workout.deload)
          .map((workout) => ({ date: workout.date, kind: 'deload' }))}
        formatValue={(value) => String(value)}
      />
      <h2>Lift trends</h2>
      <p className={styles.quiet}>Estimated 1RM trend now, and its change over the period. Deloads are left out.</p>
      <LiftTrendList lifts={lifts} />
    </>
  );
}
