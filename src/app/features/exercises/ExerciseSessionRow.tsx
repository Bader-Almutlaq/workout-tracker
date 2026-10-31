import { DeloadChip } from '../workout/DeloadChip';
import { Link } from 'react-router';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { ExerciseSession } from '../../../core/queries/ExerciseSeries';
import { dayWithYearText } from '../../format/dateText';
import { exerciseSetText } from './exerciseSetText';
import styles from './ExercisePage.module.css';

/** A finished workout link with every completed set, its explicit kind and logged effort. */
export function ExerciseSessionRow({
  session,
  tracking,
}: {
  readonly session: ExerciseSession;
  readonly tracking: ExerciseTracking;
}) {
  return (
    <Link className={styles.session} to={`/history/${session.workoutId}`}>
      <span className={styles.sessionHeading}>
        {dayWithYearText(session.date)} · {session.name}
      </span>
      {session.sets.length === 0 && <span>No completed sets.</span>}
      {session.sets.map((set) => (
        <span className={styles.set} key={set.id}>
          <span className={styles.kind}>
            {session.deloadEntryIds.includes(set.workoutExerciseId) &&
              session.sets.find((row) => row.workoutExerciseId === set.workoutExerciseId)?.id === set.id && (
                <DeloadChip />
              )}
            {set.kind === 'warmup'
              ? 'Warm-up'
              : set.kind === 'drop'
                ? 'Drop'
                : set.kind === 'failure'
                  ? 'Failure'
                  : 'Working'}
          </span>
          {exerciseSetText(set, tracking)}
        </span>
      ))}
    </Link>
  );
}
