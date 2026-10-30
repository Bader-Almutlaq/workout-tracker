import { useState } from 'react';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { TextField } from '../../design/components/TextField';

/** Asks for a new name for the workout. A blank name changes nothing. */
export function RenameWorkoutDialog({
  name,
  onRename,
  onCancel,
}: {
  readonly name: string;
  readonly onRename: (name: string) => void;
  readonly onCancel: () => void;
}) {
  const [draft, setDraft] = useState(name);
  return (
    <ConfirmDialog title="Rename workout" confirmLabel="Rename" onConfirm={() => onRename(draft)} onCancel={onCancel}>
      <TextField label="Name" value={draft} onChange={setDraft} />
    </ConfirmDialog>
  );
}
