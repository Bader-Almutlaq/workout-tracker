import type { ReactNode } from 'react';
import styles from './ToggleChip.module.css';

/** A pill that is either on or off: a filter such as "Mine", or one muscle in a picker. */
export function ToggleChip({
  isOn,
  isDisabled = false,
  onToggle,
  children,
}: {
  readonly isOn: boolean;
  readonly isDisabled?: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button type="button" className={styles.chip} aria-pressed={isOn} disabled={isDisabled} onClick={onToggle}>
      {children}
    </button>
  );
}
