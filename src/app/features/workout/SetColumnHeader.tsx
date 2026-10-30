import { Check } from 'lucide-react';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import grid from './SetGrid.module.css';
import styles from './SetColumnHeader.module.css';
import { isBodyweightLoad, recordsDuration, recordsWeight } from './trackingKinds';

/** The titles above an exercise's sets: SET, PREVIOUS, the weight unit, REPS (or TIME), RPE and a check. */
export function SetColumnHeader({
  tracking,
  unit,
}: {
  readonly tracking: ExerciseTracking;
  readonly unit: WeightUnit;
}) {
  return (
    <div className={`${grid.grid} ${styles.header}`} data-weight={recordsWeight(tracking)}>
      <span>Set</span>
      <span>Previous</span>
      {recordsWeight(tracking) && (
        <span className={styles.centered}>{`${isBodyweightLoad(tracking) ? '+' : ''}${unit}`}</span>
      )}
      <span className={styles.centered}>{recordsDuration(tracking) ? 'Time' : 'Reps'}</span>
      <span className={styles.centered}>RPE</span>
      <Check size={14} strokeWidth={2} className={styles.check} aria-hidden />
    </div>
  );
}
