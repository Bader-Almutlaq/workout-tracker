import { useWorkoutDrag } from '../../design/drag/WorkoutDrag';
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
  const drag = useWorkoutDrag();
  return (
    <button
      type="button"
      className={styles.row}
      disabled={isDisabled}
      onPointerDown={(event) => drag?.start(event, { kind: 'past', id: workout.id, name: workout.name })}
      onContextMenu={(event) => event.preventDefault()}
      onClick={() => {
        if (!drag?.consumeClick()) onPress();
      }}
    >
      <span className={styles.main}>
        <span className={styles.name}>{workout.name}</span>
        <span className={styles.meta}>{dayText(workout.startedAt)}</span>
      </span>
      <span className={styles.count}>{exerciseCountText(workout.exerciseCount)}</span>
    </button>
  );
}
