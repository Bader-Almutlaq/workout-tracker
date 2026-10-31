import { EmptyState } from '../../design/components/EmptyState';
import { importSources, type ImportSource } from './importSources';
import styles from './StrongImportScreen.module.css';

/** File selection instructions and retry action. */
export function ImportPickStep({
  source,
  failed,
  message,
  choose,
  detected,
  switchSource,
}: {
  source: ImportSource;
  failed: boolean;
  message: string;
  choose: () => void;
  detected: ImportSource | undefined;
  switchSource: (source: ImportSource) => void;
}) {
  if (failed)
    return (
      <>
        <EmptyState message={`Import didn't work. ${message}`} />
        {detected !== undefined && (
          <button className={styles.primary} onClick={() => switchSource(detected)}>
            Import as {importSources[detected].name} instead
          </button>
        )}
        <button className={detected === undefined ? styles.primary : styles.secondary} onClick={choose}>
          Choose files again
        </button>
      </>
    );
  const app = importSources[source];
  return (
    <>
      <ol className={styles.description}>
        {app.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className={styles.note}>
        {app.verified
          ? "Nothing is saved until you've reviewed the import."
          : "Not yet checked against a real export from this app. Nothing is saved until you've reviewed the import."}
      </p>
      <button className={styles.primary} onClick={choose}>
        Choose files…
      </button>
    </>
  );
}
