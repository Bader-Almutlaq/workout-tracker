import styles from './EmptyState.module.css';

/** What to do next, in one line. No illustrations (docs/DESIGN.md → Layout principles). */
export function EmptyState({ message }: { readonly message: string }) {
  return <p className={styles.message}>{message}</p>;
}
