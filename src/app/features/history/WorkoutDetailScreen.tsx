import { useState } from 'react';
import { LoggingErrorBanner } from '../workout/LoggingErrorBanner';
import { PastWorkoutActions } from './PastWorkoutActions';
import { PastWorkoutEditor } from './PastWorkoutEditor';
import { PersonalBestsSection } from '../workout/PersonalBestsSection';
import { useParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { Section } from '../../design/components/Section';
import { dayAndTimeText, durationText } from '../../format/dateText';
import { setLabels } from '../../format/setText';
import { SetRow } from './SetRow';
import styles from './WorkoutDetailScreen.module.css';

const MISSING_MESSAGE = 'This workout no longer exists.';

/** One past workout: each exercise with its sets, weights in the unit they were typed in. */
export function WorkoutDetailScreen() {
  const workoutId = Number(useParams().workoutId);
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | undefined>();
  const detail = useDatabaseQuery(`workout-${workoutId}`, async () => ({
    detail: await database.pastWorkout(workoutId),
    bests: await database.personalBestsForWorkout(workoutId),
  }));
  const back = <BackLink to="/history" label="History" />;

  if (detail.status !== 'ready' || detail.value.detail === undefined) {
    const message =
      detail.status === 'loading' ? 'Loading…' : detail.status === 'failed' ? detail.message : MISSING_MESSAGE;
    return (
      <Screen title="Workout" leading={back}>
        <EmptyState message={message} />
      </Screen>
    );
  }

  const snapshot = detail.value.detail;
  const { workout, entries } = snapshot;
  if (editingWorkoutId === workoutId)
    return <PastWorkoutEditor key={workoutId} snapshot={snapshot} onDone={() => setEditingWorkoutId(undefined)} />;
  const duration = durationText(workout.startedAt, workout.endedAt);
  const when = dayAndTimeText(workout.startedAt);

  return (
    <Screen title={workout.name} subtitle={duration === undefined ? when : `${when} · ${duration}`} leading={back}>
      <LoggingErrorBanner />
      <PastWorkoutActions workout={workout} onEdit={() => setEditingWorkoutId(workoutId)} />
      <PersonalBestsSection bests={detail.value.bests} />
      {entries.map(({ entry, exercise, sets }) => {
        const labels = setLabels(sets);
        return (
          <Section key={entry.id} label={exercise.name} {...(entry.notes === null ? {} : { footnote: entry.notes })}>
            {sets.map((set, index) => (
              <SetRow key={set.id} set={set} label={labels[index] ?? ''} />
            ))}
          </Section>
        );
      })}
      {workout.notes !== null && (
        <Section label="Notes">
          <p className={styles.notes}>{workout.notes}</p>
        </Section>
      )}
    </Screen>
  );
}
