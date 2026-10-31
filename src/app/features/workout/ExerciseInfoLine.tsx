import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { clockText } from '../../format/clockText';
import styles from './ExerciseCard.module.css';

/** Only existing metadata appears; unset rest and notes leave no blank line. */
export function ExerciseInfoLine({ entry }: { readonly entry: LiveWorkoutEntry }) {
  const rest = entry.exercise.restTargetSeconds;
  const note = entry.entry.notes;
  if (rest === null && !note) return null;
  return (
    <div className={styles.info}>
      {rest !== null && <span>Rest {clockText(rest)}</span>}
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
}
