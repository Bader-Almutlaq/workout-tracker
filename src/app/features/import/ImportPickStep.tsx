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
        Export your workouts from Strong, Hevy, FitNotes or Fitbod as CSV. Save the file to Files, then select it here.
        For Strong: Settings → Export Data. You can also select its measurement files.
      </p>
      <p className={styles.note}>Nothing is saved until you've reviewed the import.</p>
      <button className={styles.primary} onClick={choose}>
        Choose files…
      </button>
    </>
  );
}
