import { WEIGHT_UNITS, type WeightUnit } from '../../../core/units/WeightUnit';
import { ToggleChip } from '../../design/components/ToggleChip';
import styles from './PadUnitToggle.module.css';

/** Switches the set being edited, and its exercise, between kg and lb. */
export function PadUnitToggle({
  unit,
  onChange,
}: {
  readonly unit: WeightUnit;
  readonly onChange: (unit: WeightUnit) => void;
}) {
  return (
    <div className={styles.toggle} role="group" aria-label="Unit">
      {WEIGHT_UNITS.map((choice) => (
        <ToggleChip key={choice} isOn={choice === unit} onToggle={() => onChange(choice)}>
          {choice}
        </ToggleChip>
      ))}
    </div>
  );
}
