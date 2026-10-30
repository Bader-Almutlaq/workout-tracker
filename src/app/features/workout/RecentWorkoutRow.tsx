import type { WorkoutSummary } from '../../../core/queries/WorkoutHistory';
import { dayText } from '../../format/dateText';
import styles from './RecentWorkoutRow.module.css';

/** "N exercises", singular for one. */
function exerciseCountText(count: number): string {
  return count === 1 ? '1 exercise' : `${count} exercises`;
}

/** One past workout that can be repeated: its name, date and exercise count. */
export function RecentWorkoutRow({
  workout,
  isDisabled,
  onPress,
}: {
  readonly workout: WorkoutSummary;
  readonly isDisabled: boolean;
  readonly onPress: () => void;
}) {
  return (
    <button type="button" className={styles.row} disabled={isDisabled} onClick={onPress}>
      <span className={styles.main}>
        <span className={styles.name}>{workout.name}</span>
        <span className={styles.meta}>{dayText(workout.startedAt)}</span>
      </span>
      <span className={styles.count}>{exerciseCountText(workout.exerciseCount)}</span>
    </button>
  );
}
