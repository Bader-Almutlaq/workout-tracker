import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import styles from './SuggestionRow.module.css';

/** A suggested library exercise: its name, its primary muscles and a "Match" button. */
export function SuggestionRow({
  entry,
  onMatch,
}: {
  readonly entry: ExerciseSearchEntry;
  readonly onMatch: () => void;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span className={styles.name}>{entry.name}</span>
        <span className={styles.muscles}>
          {entry.primaryMuscles.map((muscle) => MUSCLE_DISPLAY_NAMES[muscle]).join(' · ')}
        </span>
      </div>
      <button type="button" className={styles.match} onClick={onMatch}>
        Match
      </button>
    </div>
  );
}
