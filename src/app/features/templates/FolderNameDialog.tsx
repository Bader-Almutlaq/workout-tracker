import { useState } from 'react';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { TextField } from '../../design/components/TextField';

/** Asks for a folder's name, for a new folder or a rename. A blank name is refused by the template store and shown as its message. */
export function FolderNameDialog({
  title,
  confirmLabel,
  initialName,
  onConfirm,
  onCancel,
}: {
  readonly title: string;
  readonly confirmLabel: string;
  readonly initialName: string;
  readonly onConfirm: (name: string) => void;
  readonly onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  return (
    <ConfirmDialog title={title} confirmLabel={confirmLabel} onConfirm={() => onConfirm(name)} onCancel={onCancel}>
      <TextField label="Name" value={name} onChange={setName} />
    </ConfirmDialog>
  );
}
