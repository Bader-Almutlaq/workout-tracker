import { dayWithYearText } from '../../format/dateText';
import { ElapsedClock } from './ElapsedClock';
import styles from './WorkoutMetadata.module.css';

/** The session's local date and elapsed time below its name; the sticky bar also keeps time visible. */
export function WorkoutMetadata({ startedAt }: { readonly startedAt: string }) {
  return (
    <span className={styles.metadata}>
      <span>{dayWithYearText(startedAt)}</span>
      <ElapsedClock startedAt={startedAt} />
    </span>
  );
}
