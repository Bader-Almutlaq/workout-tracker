import { useState } from 'react';
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
}: {
  readonly workoutId: number;
  readonly workoutName: string;
}) {
  const [isAsking, setIsAsking] = useState(false);
  const [savedName, setSavedName] = useState<string | undefined>(undefined);

  if (savedName !== undefined) return <p className={styles.saved}>Saved as workout “{savedName}”.</p>;
  return (
    <>
      <Button onPress={() => setIsAsking(true)}>Save as workout</Button>
      {isAsking && (
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
