import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './Button.module.css';
import type { ButtonVariant } from './Button';

/** A `Button` that goes to another screen. */
export function LinkButton({
  to,
  variant = 'quiet',
  children,
}: {
  readonly to: string;
  readonly variant?: ButtonVariant;
  readonly children: ReactNode;
}) {
  return (
    <Link to={to} className={styles.button} data-variant={variant}>
      {children}
    </Link>
  );
}
