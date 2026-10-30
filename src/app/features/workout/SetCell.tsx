import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { Field } from './Cell';
import type { EditedCell } from './CellEditor';
import { cellText, isCellEmpty } from './setCellText';
import { recordsDuration } from './trackingKinds';
import { ValueCell } from './ValueCell';

/** The name of a cell for screen readers. */
function cellName(field: Field, tracking: ExerciseTracking): string {
  if (field === 'weight') return 'Weight';
  if (field === 'rpe') return 'RPE';
  return recordsDuration(tracking) ? 'Time' : 'Reps';
}

/**
 * One value of a set row. While the pad is typing into it, it shows the typed text ("0", or "—"
 * for RPE, when nothing is typed); otherwise the saved value.
 */
export function SetCell({
  set,
  field,
  tracking,
  editing,
  unitSuffix,
  onPress,
  isSuggested = false,
}: {
  readonly set: WorkoutSet;
  readonly field: Field;
  readonly tracking: ExerciseTracking;
  /** The cell the pad is on, if it is this row's. */
  readonly editing: EditedCell | undefined;
  readonly unitSuffix?: string;
  readonly onPress: () => void;
  readonly isSuggested?: boolean;
}) {
  const isEditing = editing?.cell.field === field;
  const emptyText = field === 'rpe' ? '—' : '0';
  const text = isEditing ? editing.text : '';
  return (
    <ValueCell
      name={cellName(field, tracking)}
      text={isEditing ? text || emptyText : cellText(set, field, tracking)}
      isPlaceholder={isEditing ? text === '' : isSuggested || isCellEmpty(set, field, tracking)}
      isEditing={isEditing}
      {...(unitSuffix === undefined ? {} : { unitSuffix })}
      onPress={onPress}
    />
  );
}
