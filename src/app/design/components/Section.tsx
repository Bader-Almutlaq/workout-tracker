import type { ReactNode } from 'react';
import styles from './Section.module.css';

/** A labelled group: uppercase caption, then a hairline card, then an optional footnote. */
export function Section({
  label,
  footnote,
  children,
}: {
  readonly label: string;
  readonly footnote?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{label}</h2>
      <div className={styles.card}>{children}</div>
      {footnote !== undefined && <p className={styles.footnote}>{footnote}</p>}
    </section>
  );
}

/** One label–value line inside a `Section`. */
export function SectionRow({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}
