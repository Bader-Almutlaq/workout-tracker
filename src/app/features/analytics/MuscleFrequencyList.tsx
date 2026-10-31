import { useState } from 'react';
import type { MuscleCoverageItem } from '../../../core/queries/MuscleCoverage';
import { MUSCLE_DISPLAY_NAMES, type Muscle } from '../../../core/library/Muscle';
import { isMainMuscle } from '../../../core/library/MuscleProminence';
import { ToggleChip } from '../../design/components/ToggleChip';
import styles from './MuscleCoverage.module.css';

/** Weekly muscle volume and frequency with an optional smaller-muscle list. */
export function MuscleFrequencyList({
  muscles,
  onSelect,
}: {
  readonly muscles: readonly MuscleCoverageItem[];
  readonly onSelect: (muscle: Muscle) => void;
}) {
  const [showSmaller, setShowSmaller] = useState(false);
  return (
    <section className={styles.section}>
      <h2>Frequency</h2>
      <ToggleChip isOn={showSmaller} onToggle={() => setShowSmaller(!showSmaller)}>
        Show smaller muscles
      </ToggleChip>
      <div className={styles.list}>
        {muscles
          .filter((item) => showSmaller || isMainMuscle(item.muscle))
          .map((item) => (
            <button
              type="button"
              className={`${styles.row} ${styles.button}`}
              key={item.muscle}
              onClick={() => onSelect(item.muscle)}
            >
              <span>{MUSCLE_DISPLAY_NAMES[item.muscle]}</span>
              <span>
                {item.setsPerWeek.toFixed(1)} sets/week · {item.daysPerWeek.toFixed(1)} days/week
              </span>
            </button>
          ))}
      </div>
    </section>
  );
}
