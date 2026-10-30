import type { FindingItem } from './importFindingText';
import styles from './StrongImportScreen.module.css';
/** Edits a flagged set in its original entry unit. */
export function CorrectSetDialog({
  editing,
  weight,
  reps,
  message,
  setWeight,
  setReps,
  cancel,
  save,
}: {
  editing: FindingItem;
  weight: string;
  reps: string;
  message: string;
  setWeight: (value: string) => void;
  setReps: (value: string) => void;
  cancel: () => void;
  save: () => void;
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="correct-title">
        <h2 id="correct-title">Correct this set</h2>
        <p className={styles.note}>Leave a field as is to keep the logged value.</p>
        <label>
          Weight ({editing.context.set.entryUnit})
          <input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label>
          Reps
          <input inputMode="numeric" value={reps} onChange={(event) => setReps(event.target.value)} />
        </label>
        {message && <p role="alert">{message}</p>}
        <div className={styles.buttons}>
          <button onClick={() => cancel()}>Cancel</button>
          <button onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
