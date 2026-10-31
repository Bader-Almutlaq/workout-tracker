import type { ReactNode } from 'react';
import styles from './Button.module.css';

/** How prominent a button is. One `primary` per screen (docs/DESIGN.md → Layout principles). */
export type ButtonVariant = 'primary' | 'quiet' | 'destructive';

/** A full-width button for a screen's actions. */
export function Button({
  variant = 'quiet',
  isDisabled = false,
  onPress,
  children,
  type = 'button',
}: {
  readonly variant?: ButtonVariant;
  readonly isDisabled?: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
  readonly type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={styles.button} data-variant={variant} disabled={isDisabled} onClick={onPress}>
      {children}
    </button>
  );
}
