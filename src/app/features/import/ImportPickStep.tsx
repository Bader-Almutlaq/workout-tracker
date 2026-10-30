import { EmptyState } from '../../design/components/EmptyState';
import styles from './StrongImportScreen.module.css';

/** File selection instructions and retry action. */
export function ImportPickStep({ failed, message, choose }: { failed: boolean; message: string; choose: () => void }) {
  if (failed)
    return (
      <>
        <EmptyState message={`Import didn't work. ${message}`} />
        <button className={styles.primary} onClick={choose}>
          Choose files again
        </button>
      </>
    );
  return (
    <>
      <p className={styles.description}>
        In Strong: Settings → Export Data. Save the files to Files, then select all of them here: the workouts file and
        any measurement files.
      </p>
      <p className={styles.note}>Nothing is saved until you've reviewed the import.</p>
      <button className={styles.primary} onClick={choose}>
        Choose files…
      </button>
    </>
  );
}
