import { Check } from 'lucide-react';
import styles from './CheckButton.module.css';

/** Marks a set done or not done. Filled in the accent color when done. */
export function CheckButton({
  isCompleted,
  onPress,
  isDisabled = false,
}: {
  readonly isCompleted: boolean;
  readonly onPress: () => void;
  /** Finished workouts retain completion; edits change their saved performance directly. */
  readonly isDisabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={isCompleted ? 'Completed' : 'Mark as completed'}
      aria-pressed={isCompleted}
      onClick={onPress}
      disabled={isDisabled}
    >
      <Check size={18} strokeWidth={2.5} aria-hidden />
    </button>
  );
}
