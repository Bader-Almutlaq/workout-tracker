import { database, useDatabaseQuery } from '../../data/database';
import { Button } from '../../design/components/Button';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { ExercisePicker } from '../workout/ExercisePicker';
import { LoggingErrorBanner } from '../workout/LoggingErrorBanner';
import { loggingQueue } from '../workout/loggingQueue';

/** The existing exercise picker adds performed entries to this finished workout without starting a live workout. */
export function PastWorkoutExercisePicker({
  workoutId,
  onClose,
}: {
  readonly workoutId: number;
  readonly onClose: () => void;
}) {
  const entries = useDatabaseQuery('past-workout-exercise-picker', () => database.exerciseEntries());
  return (
    <Screen title="Add exercise" leading={<Button onPress={onClose}>Back to editing</Button>}>
      <LoggingErrorBanner />
      {entries.status === 'ready' ? (
        <ExercisePicker
          entries={entries.value}
          onAdd={(ids) => {
            void loggingQueue
              .enqueue(async () => {
                await database.addExercises(workoutId, ids);
                return true;
              })
              .then((saved) => {
                if (saved === true) onClose();
              });
          }}
        />
      ) : (
        <EmptyState message={entries.status === 'failed' ? entries.message : 'Loading…'} />
      )}
    </Screen>
  );
}
