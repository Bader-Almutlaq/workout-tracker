import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './LinkRow.module.css';

/**
 * A tappable row for inside a `Section`: content on the left, a chevron on the right.
 * Rows placed one after another get a hairline between them.
 */
export function LinkRow({ to, children }: { readonly to: string; readonly children: ReactNode }) {
  return (
    <Link to={to} className={styles.row}>
      <div className={styles.content}>{children}</div>
      <ChevronRight size={16} strokeWidth={2} className={styles.chevron} aria-hidden />
    </Link>
  );
}
