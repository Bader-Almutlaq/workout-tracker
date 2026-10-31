import styles from './ActiveWorkoutBar.module.css';
import { ElapsedClock } from './ElapsedClock';

/** The bar that stays at the top while the sets scroll: the clock and Finish. */
export function ActiveWorkoutBar({
  startedAt,
  onFinish,
}: {
  readonly startedAt: string;
  readonly onFinish: () => void;
}) {
  return (
    <div className={styles.bar}>
      <ElapsedClock startedAt={startedAt} />
      <div className={styles.actions}>
        <button type="button" className={styles.finish} onClick={onFinish}>
          Finish
        </button>
      </div>
    </div>
  );
}
