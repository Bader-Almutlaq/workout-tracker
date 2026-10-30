import { Check } from 'lucide-react';
import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { exerciseSubtitle } from '../exercises/exerciseText';
import styles from './PickerRow.module.css';

/** One exercise in the picker: name and muscles on the left, a check mark when picked. */
export function PickerRow({
  entry,
  isPicked,
  onToggle,
}: {
  readonly entry: ExerciseSearchEntry;
  readonly isPicked: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button type="button" className={styles.row} aria-pressed={isPicked} onClick={onToggle}>
      <span className={styles.main}>
        <span className={styles.name}>{entry.name}</span>
        <span className={styles.meta}>{exerciseSubtitle(entry)}</span>
      </span>
      {isPicked && <Check size={18} strokeWidth={2.5} className={styles.check} aria-hidden />}
    </button>
  );
}
