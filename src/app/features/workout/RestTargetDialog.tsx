import { useState } from 'react';
import { RestTimerDefaults, restTarget } from '../../../core/logging/RestTimer';
import type { Exercise } from '../../../core/models/Exercise';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { TextField } from '../../design/components/TextField';
import styles from './ExerciseCard.module.css';

/** Edits a rest target in seconds, using the existing core limits; never starts a timer. */
export function RestTargetDialog({
  exercise,
  onSave,
  onCancel,
}: {
  readonly exercise: Exercise;
  readonly onSave: (seconds: number) => void;
  readonly onCancel: () => void;
}) {
  const [draft, setDraft] = useState(String(restTarget(exercise)));
  const [error, setError] = useState('');
  return (
    <ConfirmDialog
      title="Rest time"
      confirmLabel="Save"
      onCancel={onCancel}
      onConfirm={() => {
        const seconds = Number(draft);
        if (
          draft.trim() === '' ||
          !Number.isFinite(seconds) ||
          seconds < RestTimerDefaults.minimumSeconds ||
          seconds > RestTimerDefaults.maximumSeconds
        ) {
          setError(`Enter ${RestTimerDefaults.minimumSeconds}–${RestTimerDefaults.maximumSeconds} seconds.`);
          return;
        }
        onSave(seconds);
      }}
    >
      <TextField label="Rest target (seconds)" value={draft} onChange={setDraft} />
      {error !== '' && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
