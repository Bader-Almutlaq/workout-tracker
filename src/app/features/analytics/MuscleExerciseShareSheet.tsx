import type { ExerciseShare } from '../../../core/queries/MuscleCoverage';
import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import { BottomSheet } from '../../design/components/BottomSheet';
import styles from './MuscleCoverage.module.css';

/** Exercise contributions to one muscle's fractional sets in the selected period. */
export function MuscleExerciseShareSheet({
  muscle,
  shares,
  onClose,
}: {
  readonly muscle: Muscle;
  readonly shares: readonly ExerciseShare[];
  readonly onClose: () => void;
}) {
  return (
    <BottomSheet title={`${MUSCLE_DISPLAY_NAMES[muscle]} exercise share`} onClose={onClose}>
      {shares.length === 0 ? (
        <p>No hard sets in this period.</p>
      ) : (
        shares.map((item) => (
          <div className={styles.row} key={item.exerciseId}>
            <span>{item.name}</span>
            <span>
              {item.percent.toFixed(1)}% · {item.sets.toFixed(1)} sets
            </span>
          </div>
        ))
      )}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </BottomSheet>
  );
}
