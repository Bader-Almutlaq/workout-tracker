import type { ReactNode } from 'react';
import styles from './RestBarButton.module.css';

/** A small button on the rest bar: a step in the target, or the dismiss cross. */
export function RestBarButton({
  label,
  isDisabled = false,
  onPress,
  children,
}: {
  /** Read by screen readers; the visible content is `children`. */
  readonly label: string;
  readonly isDisabled?: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button type="button" className={styles.button} aria-label={label} disabled={isDisabled} onClick={onPress}>
      {children}
    </button>
  );
}
