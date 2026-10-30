import styles from './SummaryStat.module.css';

/** One figure of the finish summary: a small label over a number. */
export function SummaryStat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
