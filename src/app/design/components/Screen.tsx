import type { ReactNode } from 'react';
import styles from './Screen.module.css';

/** A full screen with a large title, as every tab uses. Content scrolls under a safe-area-aware header. */
export function Screen({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
