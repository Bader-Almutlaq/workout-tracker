import { EQUIPMENT, EQUIPMENT_DISPLAY_NAMES } from '../../../core/library/Equipment';
import type { CustomExerciseDraft } from '../../../core/library/CustomExerciseDraft';
import { EXERCISE_TRACKING_DISPLAY_NAMES, EXERCISE_TRACKINGS } from '../../../core/library/ExerciseTracking';
import { MECHANIC_DISPLAY_NAMES, MECHANICS, type Mechanic } from '../../../core/library/Mechanic';
import { MOVEMENT_PATTERN_DISPLAY_NAMES, MOVEMENT_PATTERNS } from '../../../core/library/MovementPattern';
import { CheckboxField } from '../../design/components/CheckboxField';
import { SegmentedControl } from '../../design/components/SegmentedControl';
import { SelectField } from '../../design/components/SelectField';
import { TextField } from '../../design/components/TextField';
import { oneOf } from './oneOf';
import styles from './ExerciseDetailsFields.module.css';

const EQUIPMENT_OPTIONS = EQUIPMENT.map((value) => ({ value, label: EQUIPMENT_DISPLAY_NAMES[value] }));
const PATTERN_OPTIONS = MOVEMENT_PATTERNS.map((value) => ({ value, label: MOVEMENT_PATTERN_DISPLAY_NAMES[value] }));
const TRACKING_OPTIONS = EXERCISE_TRACKINGS.map((value) => ({ value, label: EXERCISE_TRACKING_DISPLAY_NAMES[value] }));
const MECHANIC_OPTIONS: readonly { readonly value: Mechanic | ''; readonly label: string }[] = [
  { value: '', label: 'Not set' },
  ...MECHANICS.map((value) => ({ value, label: MECHANIC_DISPLAY_NAMES[value] })),
];

/** Name, equipment, movement pattern, compound or isolation, tracking and long-length bias. */
export function ExerciseDetailsFields({
  draft,
  onChange,
}: {
  readonly draft: CustomExerciseDraft;
  readonly onChange: (draft: CustomExerciseDraft) => void;
}) {
  return (
    <>
      <TextField label="Name" value={draft.name ?? ''} onChange={(name) => onChange({ ...draft, name })} />
      <SelectField
        label="Equipment"
        noneLabel="None"
        options={EQUIPMENT_OPTIONS}
        value={draft.equipment ?? ''}
        onChange={(value) => onChange({ ...draft, equipment: oneOf(EQUIPMENT, value) ?? null })}
      />
      <SelectField
        label="Movement pattern"
        noneLabel="None"
        options={PATTERN_OPTIONS}
        value={draft.pattern ?? ''}
        onChange={(value) => onChange({ ...draft, pattern: oneOf(MOVEMENT_PATTERNS, value) ?? null })}
      />
      <div className={styles.segmented}>
        <span className={styles.segmentedLabel}>Compound or isolation</span>
        <SegmentedControl
          label="Compound or isolation"
          options={MECHANIC_OPTIONS}
          value={draft.mechanic ?? ''}
          onChange={(value) => onChange({ ...draft, mechanic: oneOf(MECHANICS, value) ?? null })}
        />
      </div>
      <SelectField
        label="Tracking"
        options={TRACKING_OPTIONS}
        value={draft.tracking ?? 'weight-reps'}
        onChange={(value) => onChange({ ...draft, tracking: oneOf(EXERCISE_TRACKINGS, value) ?? 'weight-reps' })}
      />
      <CheckboxField
        label="Long-length bias"
        hint="Loads the muscle hardest when it is stretched."
        isChecked={draft.isLengthenedBiased ?? false}
        onChange={(isLengthenedBiased) => onChange({ ...draft, isLengthenedBiased })}
      />
    </>
  );
}
