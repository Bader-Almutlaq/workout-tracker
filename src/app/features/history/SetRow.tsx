import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import { rpeText } from '../../format/setText';
import { weightText } from '../../format/weightText';
import styles from './SetRow.module.css';

/**
 * One logged set: its label (W, D, F or the working-set number), the weight in the unit it was
 * typed in, the reps, and the RPE when logged. A set with no load reads "Bodyweight".
 */
export function SetRow({ set, label }: { readonly set: WorkoutSet; readonly label: string }) {
  return (
    <div className={styles.set}>
      <div className={styles.row}>
        <span className={set.kind === 'working' ? styles.workingLabel : styles.specialLabel}>{label}</span>
        <span className={`${styles.value} ${styles.weight}`}>
          {set.weightKilograms > 0 ? weightText(set.weightKilograms, set.entryUnit) : 'Bodyweight'}
        </span>
        <span className={styles.value}>× {set.reps}</span>
        {set.rpe !== null && <span className={styles.rpe}>{rpeText(set.rpe)}</span>}
      </div>
      {set.notes !== null && set.notes !== '' && <p className={styles.note}>{set.notes}</p>}
    </div>
  );
}
