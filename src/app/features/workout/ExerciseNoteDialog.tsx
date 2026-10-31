import { useState } from 'react';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import styles from './ExerciseCard.module.css';

/** Edits a session exercise note through the existing queued writer; blank text clears it. */
export function ExerciseNoteDialog({
  note,
  onSave,
  onCancel,
}: {
  readonly note: string;
  readonly onSave: (value: string) => void;
  readonly onCancel: () => void;
}) {
  const [draft, setDraft] = useState(note);
  return (
    <ConfirmDialog title="Exercise note" confirmLabel="Save" onConfirm={() => onSave(draft)} onCancel={onCancel}>
      <label className={styles.noteField}>
        Note
        <textarea className={styles.noteInput} value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
    </ConfirmDialog>
  );
}
