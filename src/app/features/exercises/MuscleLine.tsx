import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import { Chip } from '../../design/components/Chip';
import styles from './MuscleChips.module.css';

/** A caption and the chips of one role ("Primary", "Secondary"), wrapping onto more lines as needed. */
export function MuscleLine({
  label,
  tone,
  muscles,
}: {
  readonly label: string;
  readonly tone: 'accent' | 'neutral';
  readonly muscles: readonly Muscle[];
}) {
  return (
    <div className={styles.line}>
      <span className={styles.label}>{label}</span>
      <div className={styles.chips}>
        {muscles.map((muscle) => (
          <Chip key={muscle} tone={tone}>
            {MUSCLE_DISPLAY_NAMES[muscle]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
