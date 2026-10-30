import styles from './StrongImportScreen.module.css';
/** Announces progress while an import operation runs. */
export function ImportWorkingOverlay({ message }: { message: string }) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      {message}
    </div>
  );
}
