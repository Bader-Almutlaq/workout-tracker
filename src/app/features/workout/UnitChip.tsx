import type { WeightUnit } from '../../../core/units/WeightUnit';
import { toggledWeightUnit } from '../../../core/units/WeightUnit';
import styles from './UnitChip.module.css';

/** Shows the unit an exercise is logged in ("kg" or "lb"); one tap switches to the other. */
export function UnitChip({
  unit,
  onSwitch,
}: {
  readonly unit: WeightUnit;
  readonly onSwitch: (unit: WeightUnit) => void;
}) {
  const other = toggledWeightUnit(unit);
  return (
    <button
      type="button"
      className={styles.chip}
      aria-label={`Unit ${unit}. Tap to switch to ${other}.`}
      onClick={() => onSwitch(other)}
    >
      {unit}
    </button>
  );
}
