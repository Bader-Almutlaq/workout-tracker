import { useState } from 'react';
import { log } from '../../../core/support/log';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { SelectField } from '../../design/components/SelectField';
import { TextField } from '../../design/components/TextField';
import { folderOptions } from '../templates/FolderChoice';

/** Picks an existing plan or creates one before saving a session as a workout. */
export function AddToPlanDialog({
  workoutId,
  name,
  onClose,
}: {
  readonly workoutId: number;
  readonly name: string;
  readonly onClose: () => void;
}) {
  const list = useDatabaseQuery('template-list', () => database.templateList());
  const active = useDatabaseQuery('active-plan', () => database.activePlanId());
  const [selection, setChoice] = useState<string | null>(null);
  const folders = list.status === 'ready' ? list.value.folders : [];
  const activeId = active.status === 'ready' ? active.value : null;
  const defaultFolder = folders.find((folder) => folder.id === activeId) ?? folders[0];
  const choice = selection ?? (defaultFolder === undefined ? 'new' : String(defaultFolder.id));
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const save = () => {
    setBusy(true);
    void (async () => {
      const folderId = choice === 'new' ? await database.createTemplateFolder(newName) : Number(choice);
      await database.createTemplateFromWorkout(workoutId, name, folderId);
      onClose();
    })().catch((failure: unknown) => {
      log.ui.error('Adding a workout to a plan failed', failure);
      setError(messageOf(failure));
      setBusy(false);
    });
  };
  return (
    <ConfirmDialog title="Add to plan" confirmLabel="Add" isBusy={busy} onConfirm={save} onCancel={onClose}>
      <SelectField
        label="Plan"
        noneLabel="New plan…"
        options={list.status === 'ready' ? folderOptions(list.value.folders) : []}
        value={choice === 'new' ? '' : choice}
        onChange={(value) => setChoice(value === '' ? 'new' : value)}
      />
      {choice === 'new' && <TextField label="Plan name" value={newName} onChange={setNewName} />}
      {error !== undefined && <p role="alert">{error}</p>}
    </ConfirmDialog>
  );
}
