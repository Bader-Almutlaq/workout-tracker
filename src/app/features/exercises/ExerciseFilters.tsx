import { EQUIPMENT, EQUIPMENT_DISPLAY_NAMES } from '../../../core/library/Equipment';
import { MUSCLES } from '../../../core/library/Muscle';
import { SelectChip, type SelectChipGroup } from '../../design/components/SelectChip';
import { ToggleChip } from '../../design/components/ToggleChip';
import type { ExerciseBrowseState } from './exerciseBrowseState';
import { oneOf } from './oneOf';
import styles from './ExerciseFilters.module.css';
import { MUSCLE_GROUPS } from './muscleGroups';

const MUSCLE_CHOICES: readonly SelectChipGroup[] = MUSCLE_GROUPS.map((group) => ({
  label: group.label,
  options: group.muscles.map(({ muscle, label }) => ({ value: muscle, label })),
}));

const EQUIPMENT_CHOICES: readonly SelectChipGroup[] = [
  { label: 'Equipment', options: EQUIPMENT.map((value) => ({ value, label: EQUIPMENT_DISPLAY_NAMES[value] })) },
];

/** One scrolling row of chips under the search box: muscle, equipment and "Mine". */
export function ExerciseFilters({
  state,
  onChange,
}: {
  readonly state: ExerciseBrowseState;
  readonly onChange: (state: ExerciseBrowseState) => void;
}) {
  return (
    <div className={styles.row}>
      <SelectChip
        label="Muscle"
        anyLabel="Any muscle"
        groups={MUSCLE_CHOICES}
        value={state.muscle ?? ''}
        onChange={(value) => onChange({ ...state, muscle: oneOf(MUSCLES, value) })}
      />
      <SelectChip
        label="Equipment"
        anyLabel="Any equipment"
        groups={EQUIPMENT_CHOICES}
        value={state.equipment ?? ''}
        onChange={(value) => onChange({ ...state, equipment: oneOf(EQUIPMENT, value) })}
      />
      <ToggleChip
        isOn={state.mechanic === 'compound'}
        onToggle={() => onChange({ ...state, mechanic: state.mechanic === 'compound' ? undefined : 'compound' })}
      >
        Compound
      </ToggleChip>
      <ToggleChip
        isOn={state.mechanic === 'isolation'}
        onToggle={() => onChange({ ...state, mechanic: state.mechanic === 'isolation' ? undefined : 'isolation' })}
      >
        Isolation
      </ToggleChip>
      <ToggleChip isOn={state.customOnly} onToggle={() => onChange({ ...state, customOnly: !state.customOnly })}>
        Mine
      </ToggleChip>
    </div>
  );
}
