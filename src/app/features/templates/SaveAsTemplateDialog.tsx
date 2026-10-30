import { useState } from 'react';
import { log } from '../../../core/support/log';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { SelectField } from '../../design/components/SelectField';
import { TextField } from '../../design/components/TextField';
import { folderIdOf, folderOptions, NO_FOLDER_VALUE } from './FolderChoice';
import styles from './SaveAsTemplateDialog.module.css';

/**
 * Asks for a template's name (starting with the workout's own) and, when there are folders, which
 * one it goes in. The template keeps the workout's exercises, their order, supersets and set kinds,
 * and leaves every target empty. A refusal from the template store is shown in the dialog.
 */
export function SaveAsTemplateDialog({
  workoutId,
  workoutName,
  onSaved,
  onCancel,
}: {
  readonly workoutId: number;
  readonly workoutName: string;
  /** Called with the name the template was saved under. */
  readonly onSaved: (name: string) => void;
  readonly onCancel: () => void;
}) {
  const list = useDatabaseQuery('template-list', () => database.templateList());
  const [name, setName] = useState(workoutName);
  const [folder, setFolder] = useState(NO_FOLDER_VALUE);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const folders = list.status === 'ready' ? list.value.folders : [];

  const save = () => {
    setIsSaving(true);
    setError(undefined);
    database.createTemplateFromWorkout(workoutId, name, folderIdOf(folder)).then(
      () => onSaved(name.trim()),
      (failure: unknown) => {
        log.ui.error('Saving a workout as a template failed', failure);
        setError(messageOf(failure));
        setIsSaving(false);
      },
    );
  };

  return (
    <ConfirmDialog title="Save as template" confirmLabel="Save" isBusy={isSaving} onConfirm={save} onCancel={onCancel}>
      <TextField label="Name" value={name} onChange={setName} />
      {folders.length > 0 && (
        <SelectField
          label="Folder"
          noneLabel="No folder"
          options={folderOptions(folders)}
          value={folder}
          onChange={setFolder}
        />
      )}
      {error !== undefined && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
