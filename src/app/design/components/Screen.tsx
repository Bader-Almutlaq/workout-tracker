import type { ReactNode } from 'react';
import styles from './Screen.module.css';

/**
 * A full screen with a large title, as every tab uses. Content scrolls under a safe-area-aware header.
 * `leading` sits above the title (a `BackLink` on a pushed screen); `subtitle` sits under it.
 * The title is usually text; the Workout tab passes a button so the name can be tapped to rename it.
 */
export function Screen({
  title,
  subtitle,
  titleAccessory,
  leading,
  trailing,
  children,
}: {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  /** Optional action beside the title, without placing interactive menus inside the heading. */
  readonly titleAccessory?: ReactNode;
  readonly leading?: ReactNode;
  /** Optional trailing header action. */
  readonly trailing?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <main className={styles.screen}>
      {leading}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.heading}>
            <h1 className={styles.title}>{title}</h1>
            {titleAccessory}
          </div>
          {trailing}
        </div>
        {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}
      </header>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
