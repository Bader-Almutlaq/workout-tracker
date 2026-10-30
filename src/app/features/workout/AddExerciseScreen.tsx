import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { ExercisePicker } from './ExercisePicker';

/** Pick exercises to add to the workout in progress. Reached from "Add exercise" on the Workout tab. */
export function AddExerciseScreen() {
  const entries = useDatabaseQuery('exercise-entries', () => database.exerciseEntries());
  const workoutId = useDatabaseQuery('active-workout-id', () => database.activeWorkoutId());
  const back = <BackLink to="/" label="Workout" />;

  if (entries.status === 'ready' && workoutId.status === 'ready') {
    return (
      <Screen title="Add exercise" leading={back}>
        {workoutId.value === null ? (
          <EmptyState message="No workout is in progress. Start one on the Workout tab." />
        ) : (
          <ExercisePicker entries={entries.value} workoutId={workoutId.value} />
        )}
      </Screen>
    );
  }
  const failure = [entries, workoutId].find((query) => query.status === 'failed');
  return (
    <Screen title="Add exercise" leading={back}>
      <EmptyState message={failure?.status === 'failed' ? failure.message : 'Loading…'} />
    </Screen>
  );
}
