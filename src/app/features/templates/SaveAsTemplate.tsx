import { useState } from 'react';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { log } from '../../../core/support/log';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { Button } from '../../design/components/Button';
import styles from './SaveAsTemplate.module.css';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';

/**
 * The "Save as workout" button of the finish summary. After saving it becomes a quiet line saying
 * what the template is called, so the same workout is not saved twice by accident.
 */
export function SaveAsTemplate({
  workoutId,
  workoutName,
  templateId,
}: {
  readonly workoutId: number;
  readonly workoutName: string;
  readonly templateId: number | null;
}) {
  const template = useDatabaseQuery(`finish-template-${templateId}`, () =>
    templateId === null ? Promise.resolve(null) : database.templateDetail(templateId),
  );
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [savedName, setSavedName] = useState<string | undefined>(undefined);

  if (templateId !== null && template.status !== 'ready')
    return <p>{template.status === 'failed' ? template.message : 'Loading…'}</p>;
  const templateName = template.status === 'ready' ? template.value?.name : undefined;
  if (savedName !== undefined)
    return (
      <p className={styles.saved}>
        {templateName === undefined ? 'Saved as workout' : 'Updated workout'} “{savedName}”.
      </p>
    );
  return (
    <>
      <Button onPress={() => setIsAsking(true)}>
        {templateName === undefined ? 'Save as workout' : `Update “${templateName}”`}
      </Button>
      {isAsking && templateName !== undefined && (
        <ConfirmDialog
          title={`Update “${templateName}”?`}
          confirmLabel="Update"
          isBusy={busy}
          onCancel={() => setIsAsking(false)}
          onConfirm={() => {
            setBusy(true);
            setError(undefined);
            database.updateTemplateFromWorkout(workoutId).then(
              () => {
                setSavedName(templateName);
                setIsAsking(false);
              },
              (failure: unknown) => {
                log.ui.error('Updating a workout failed', failure);
                setError(messageOf(failure));
                setBusy(false);
              },
            );
          }}
        >
          <p>Replace its exercises and set types with this session? Existing targets are kept where they match.</p>
          {error !== undefined && <p role="alert">{error}</p>}
        </ConfirmDialog>
      )}
      {isAsking && templateName === undefined && (
        <SaveAsTemplateDialog
          workoutId={workoutId}
          workoutName={workoutName}
          onSaved={(name) => {
            setSavedName(name);
            setIsAsking(false);
          }}
          onCancel={() => setIsAsking(false)}
        />
      )}
    </>
  );
}
