import { database, useDatabaseQuery } from '../../data/database';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { ActiveWorkout } from './ActiveWorkout';
import { StartWorkout } from './StartWorkout';

/**
 * The Workout tab. While a workout is in progress it is the logging screen, and it stays so after
 * the app is closed and reopened; otherwise it offers to start one.
 */
export function WorkoutScreen() {
  const live = useDatabaseQuery('live-workout', () => database.liveWorkout());
  if (live.status === 'loading')
    return (
      <Screen title="Workout">
        <EmptyState message="Loading…" />
      </Screen>
    );
  if (live.status === 'failed')
    return (
      <Screen title="Workout">
        <EmptyState message={live.message} />
      </Screen>
    );
  if (live.value === null) return <StartWorkout />;
  return <ActiveWorkout key={live.value.workout.id} snapshot={live.value} />;
}
