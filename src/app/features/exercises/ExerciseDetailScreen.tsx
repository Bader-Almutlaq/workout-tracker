import { useParams } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { BackLink } from '../../design/components/BackLink';
import { EmptyState } from '../../design/components/EmptyState';
import { Screen } from '../../design/components/Screen';
import { Section, SectionRow } from '../../design/components/Section';
import { dayWithYearText } from '../../format/dateText';
import styles from './ExerciseDetailScreen.module.css';
import { ExerciseActions } from './ExerciseActions';
import { exerciseTraitsText, usageText } from './exerciseText';
import { MuscleChips } from './MuscleChips';
import { RecentSessionRow } from './RecentSessionRow';
import { StrengthCard } from './StrengthCard';

const MISSING_MESSAGE = 'This exercise no longer exists.';

/** One exercise: the muscles it trains, how often it was logged, recent sessions, and its actions. */
export function ExerciseDetailScreen() {
  const exerciseId = Number(useParams().exerciseId);
  const detail = useDatabaseQuery(`exercise-${exerciseId}`, () => database.exerciseDetail(exerciseId));
  const back = <BackLink to="/exercises" label="Exercises" />;

  if (detail.status !== 'ready' || detail.value === null) {
    const message =
      detail.status === 'loading' ? 'Loading…' : detail.status === 'failed' ? detail.message : MISSING_MESSAGE;
    return (
      <Screen title="Exercise" leading={back}>
        <EmptyState message={message} />
      </Screen>
    );
  }

  const { exercise, aliases, recentSessions } = detail.value;
  const traits = exerciseTraitsText(exercise);

  return (
    <Screen title={exercise.name} leading={back}>
      {exercise.isArchived && <p className={styles.note}>Archived: hidden from search and lists. History is kept.</p>}
      <Section label="Muscles">
        <MuscleChips primary={detail.value.primaryMuscles} secondary={detail.value.secondaryMuscles} />
        {traits !== '' && <p className={styles.traits}>{traits}</p>}
      </Section>
      {detail.value.workoutCount > 0 && (
        <Section label="Usage">
          <SectionRow label="Logged" value={usageText(detail.value.workoutCount, detail.value.setCount)} />
          {detail.value.firstUsedAt !== null && (
            <SectionRow label="First" value={dayWithYearText(detail.value.firstUsedAt.toISOString())} />
          )}
          {detail.value.lastUsedAt !== null && (
            <SectionRow label="Last" value={dayWithYearText(detail.value.lastUsedAt.toISOString())} />
          )}
        </Section>
      )}
      {exercise.tracking === 'weight-reps' && (
        <StrengthCard key={exercise.id} exerciseId={exercise.id} unit={exercise.defaultEntryUnit} />
      )}
      {recentSessions.length > 0 && (
        <Section label="Recent">
          {recentSessions.map((session) => (
            <RecentSessionRow key={session.workoutId} session={session} />
          ))}
        </Section>
      )}
      {aliases.length > 0 && <p className={styles.aliases}>Also known as: {aliases.join(', ')}</p>}
      <ExerciseActions detail={detail.value} />
    </Screen>
  );
}
