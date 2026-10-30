import type { ReactNode } from 'react';
import styles from './Chip.module.css';

/** A small read-only pill, such as a muscle on the detail screen. `accent` marks the important ones. */
export function Chip({ tone, children }: { readonly tone: 'accent' | 'neutral'; readonly children: ReactNode }) {
  return (
    <span className={styles.chip} data-tone={tone}>
      {children}
    </span>
  );
}
