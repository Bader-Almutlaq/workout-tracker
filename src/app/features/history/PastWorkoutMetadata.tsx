import type { Workout } from '../../../core/models/Workout';
import { database } from '../../data/database';
import { Section } from '../../design/components/Section';
import { loggingQueue } from '../workout/loggingQueue';
import { WorkoutTextField } from '../workout/WorkoutTextField';
import { changedDurationSeconds, localWorkoutStart, workoutDurationMinutes } from './pastWorkoutFields';

/** Finished workout metadata saves one field at a time, so adjacent queued edits never replace each other's values. */
export function PastWorkoutMetadata({ workout }: { readonly workout: Workout }) {
  return (
    <Section label="Workout details">
      <WorkoutTextField
        label="Name"
        value={workout.name}
        onSave={(value) => {
          void loggingQueue.enqueue(() => database.updatePastWorkout(workout.id, { field: 'name', value }));
        }}
      />
      <WorkoutTextField
        isMultiline
        label="Workout notes"
        value={workout.notes ?? ''}
        onSave={(value) => {
          void loggingQueue.enqueue(() => database.updatePastWorkout(workout.id, { field: 'notes', value }));
        }}
      />
      <WorkoutTextField
        label="Start time"
        type="datetime-local"
        value={localWorkoutStart(workout.startedAt)}
        onSave={(value) => {
          void loggingQueue.enqueue(() => database.updatePastWorkout(workout.id, { field: 'startedAt', value }));
        }}
      />
      <WorkoutTextField
        label="Duration (minutes)"
        type="number"
        value={workoutDurationMinutes(workout.startedAt, workout.endedAt)}
        onSave={(value) => {
          const seconds = changedDurationSeconds(value, workout.startedAt, workout.endedAt);
          if (seconds !== undefined) {
            void loggingQueue.enqueue(() =>
              database.updatePastWorkout(workout.id, { field: 'durationSeconds', value: seconds }),
            );
          }
        }}
      />
    </Section>
  );
}
