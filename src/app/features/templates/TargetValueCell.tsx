import { rpeNumberText } from '../../format/setText';
import { ValueCell } from '../workout/ValueCell';
import type { TargetField } from './TargetCell';

/** What an empty target shows. */
const EMPTY_TEXT = '—';

/** The name of a target for screen readers. */
function targetName(field: TargetField): string {
  switch (field) {
    case 'repsLow':
      return 'Reps from';
    case 'repsHigh':
      return 'Reps to';
    case 'rpe':
      return 'RPE';
  }
}

/**
 * One target of a template set. It shows the number the owner wrote, or a dash when it is empty
 * (the app never suggests one). While the pad types into it, it shows what is typed.
 */
export function TargetValueCell({
  field,
  value,
  typedText,
  onPress,
}: {
  readonly field: TargetField;
  readonly value: number | null;
  /** The text being typed, when the pad is on this cell. */
  readonly typedText: string | undefined;
  readonly onPress: () => void;
}) {
  const isEditing = typedText !== undefined;
  const savedText = value === null ? '' : field === 'rpe' ? rpeNumberText(value) : String(value);
  const text = isEditing ? typedText : savedText;
  return (
    <ValueCell
      name={targetName(field)}
      text={text === '' ? EMPTY_TEXT : text}
      isPlaceholder={text === ''}
      isEditing={isEditing}
      onPress={onPress}
    />
  );
}
