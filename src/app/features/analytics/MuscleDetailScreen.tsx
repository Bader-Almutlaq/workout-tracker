import { useParams, useSearchParams } from 'react-router';
import { MUSCLES, MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { analyticsPeriod, type AnalyticsPeriod } from './analyticsPeriod';
import { WeeklySetsChart } from './WeeklySetsChart';
import { LiftTrendList } from './LiftTrendList';
import { RepRangeBars } from './RepRangeBars';
import { EffortHistogram } from './EffortHistogram';

/** Selected muscle's weekly sets, contributing exercises, strength and effort. */
export function MuscleDetailScreen() {
  const { muscle: name } = useParams();
  const [params] = useSearchParams();
  const muscle = MUSCLES.find((item) => item === name);
  const periods: readonly AnalyticsPeriod[] = ['4W', '12W', '6M', '1Y', 'All'];
  const period = periods.find((item) => item === params.get('period')) ?? '12W';
  const first = useDatabaseQuery('first-finished-workout', () => database.firstFinishedWorkout());
  const range = analyticsPeriod(period, new Date(), first.status === 'ready' ? first.value : null);
  const start = range.from.toISOString();
  const end = new Date(range.to.getTime() - 1).toISOString();
  const query = useDatabaseQuery(`muscle-detail-${name}-${start}-${end}-${first.status}`, async () =>
    muscle === undefined || first.status !== 'ready' ? null : database.muscleDetail(start, end, muscle),
  );
  return (
    <Screen
      title={muscle === undefined ? 'Muscle' : MUSCLE_DISPLAY_NAMES[muscle]}
      leading={<BackLink to={`/analytics?period=${period}`} label="Analytics" />}
    >
      {muscle === undefined ? (
        <EmptyState message="Muscle not found." />
      ) : query.status === 'failed' ? (
        <EmptyState message={query.message} />
      ) : query.status !== 'ready' || query.value === null ? (
        <EmptyState message="Loading…" />
      ) : (
        <>
          <WeeklySetsChart
            title="Weekly fractional sets"
            points={query.value.weekly.map((week) => ({
              date: week.weekStart,
              value: week.muscle?.totalSets ?? 0,
              deload: query.value?.effort.find((item) => item.weekStart === week.weekStart)?.hasDeload ?? false,
            }))}
          />
          <section>
            <h2>Exercise contributions</h2>
            {query.value.summary?.shares.map((share) => (
              <p key={share.exerciseId}>
                {share.name} · {share.sets.toFixed(1)} sets · {share.percent.toFixed(0)}%
              </p>
            ))}
          </section>
          <section>
            <h2>Strength by exercise</h2>
            <LiftTrendList lifts={query.value.strength} />
          </section>
          <RepRangeBars buckets={query.value.mix.reps} />
          <EffortHistogram buckets={query.value.mix.effort} notLogged={query.value.mix.notLogged} />
        </>
      )}
    </Screen>
  );
}
