import { clockText } from '../../format/clockText';
import styles from './ElapsedClock.module.css';
import { useElapsedSeconds } from './useElapsedSeconds';

/** How long the workout has been going, as `m:ss` or `h:mm:ss`, ticking every second. */
export function ElapsedClock({ startedAt }: { readonly startedAt: string }) {
  return (
    <span className={styles.clock} role="timer" aria-label="Elapsed time">
      {clockText(useElapsedSeconds(startedAt))}
    </span>
  );
}
