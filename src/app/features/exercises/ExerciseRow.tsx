import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { LinkRow } from '../../design/components/LinkRow';
import styles from './ExerciseRow.module.css';
import { exerciseSubtitle } from './exerciseText';

/** One exercise in a list: its name, the muscles it trains and how often it was logged, and a "Custom" badge. */
export function ExerciseRow({ entry }: { readonly entry: ExerciseSearchEntry }) {
  return (
    <LinkRow to={`/exercises/${entry.id}`}>
      <div className={styles.row}>
        <div className={styles.main}>
          <span className={styles.name}>{entry.name}</span>
          <span className={styles.meta}>{exerciseSubtitle(entry)}</span>
        </div>
        {entry.isCustom && <span className={styles.badge}>Custom</span>}
      </div>
    </LinkRow>
  );
}
