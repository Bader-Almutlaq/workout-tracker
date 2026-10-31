import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import styles from './HeaderLink.module.css';

/** An icon button in a screen header that opens another screen, with an accessible label and a full touch target. */
export function HeaderLink({
  to,
  label,
  icon: Icon,
}: {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
}) {
  return (
    <Link to={to} className={styles.button} aria-label={label}>
      <Icon size={22} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
