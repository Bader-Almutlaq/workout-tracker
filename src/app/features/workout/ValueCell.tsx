import styles from './ValueCell.module.css';

/** One tappable number in a set row: weight, reps or RPE. Opens the number pad. */
export function ValueCell({
  name,
  text,
  isPlaceholder,
  isEditing,
  unitSuffix,
  onPress,
}: {
  /** What the cell holds, for screen readers: "Weight", "Reps"… */
  readonly name: string;
  readonly text: string;
  /** Nothing logged yet, so the number is drawn quieter. */
  readonly isPlaceholder: boolean;
  readonly isEditing: boolean;
  /** The unit, when the set was typed in a different unit than the exercise shows. */
  readonly unitSuffix?: string;
  readonly onPress: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.cell}
      data-editing={isEditing}
      data-placeholder={isPlaceholder}
      aria-label={name}
      onClick={onPress}
    >
      <span className={styles.value}>{text}</span>
      {unitSuffix !== undefined && !isEditing && <span className={styles.unit}>{unitSuffix}</span>}
    </button>
  );
}
