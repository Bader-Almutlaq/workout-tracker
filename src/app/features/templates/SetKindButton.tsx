import type { SetKind } from '../../../core/models/SetKind';
import { SET_KIND_NAMES } from '../workout/setKindItems';
import styles from './SetKindButton.module.css';

/** What the kind is called on the button; shorter than the menu names so all four fit the column. */
const SHORT_NAMES: Readonly<Record<SetKind, string>> = {
  working: 'Working',
  warmup: 'Warm-up',
  drop: 'Drop',
  failure: 'Failure',
};

/** The kind of a template set. Tapping it steps to the next kind. */
export function SetKindButton({
  kind,
  setNumber,
  onPress,
}: {
  readonly kind: SetKind;
  /** The set's place in its exercise, from 1, for screen readers. */
  readonly setNumber: number;
  readonly onPress: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.button}
      data-kind={kind}
      aria-label={`Set ${setNumber}, ${SET_KIND_NAMES[kind]}. Change kind`}
      onClick={onPress}
    >
      <span>{SHORT_NAMES[kind]}</span>
    </button>
  );
}
