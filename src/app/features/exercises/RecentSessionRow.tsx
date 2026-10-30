import type { ExerciseCatalogSession } from '../../../core/queries/ExerciseCatalog';
import { dayWithYearText } from '../../format/dateText';
import { setCountText } from '../../format/setText';
import styles from './RecentSessionRow.module.css';
import { topSetText } from './exerciseText';

/** One past session of an exercise: the day, its best set and the number of work sets. */
export function RecentSessionRow({ session }: { readonly session: ExerciseCatalogSession }) {
  return (
    <div className={styles.row}>
      <span className={styles.date}>{dayWithYearText(session.startedAt.toISOString())}</span>
      <div className={styles.result}>
        <span className={styles.topSet}>{topSetText(session.topSet)}</span>
        <span className={styles.sets}>{setCountText(session.workSetCount)}</span>
      </div>
    </div>
  );
}
