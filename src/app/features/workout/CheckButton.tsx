import { Check } from 'lucide-react';
import styles from './CheckButton.module.css';

/** Marks a set done or not done. Filled in the accent color when done. */
export function CheckButton({ isCompleted, onPress }: { readonly isCompleted: boolean; readonly onPress: () => void }) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={isCompleted ? 'Completed' : 'Mark as completed'}
      aria-pressed={isCompleted}
      onClick={onPress}
    >
      <Check size={18} strokeWidth={2.5} aria-hidden />
    </button>
  );
}
