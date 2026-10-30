import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { CustomExerciseDraft } from '../../../core/library/CustomExerciseDraft';
import { log } from '../../../core/support/log';
import { database, messageOf } from '../../data/database';
import { Button } from '../../design/components/Button';
import { Section } from '../../design/components/Section';
import { canSaveDraft, withPrimaryToggled, withSecondaryToggled } from './exerciseDraft';
import styles from './ExerciseForm.module.css';
import { ExerciseDetailsFields } from './ExerciseDetailsFields';
import { MusclePicker } from './MusclePicker';

/**
 * The fields of an exercise and the Save button. Creates a new exercise, or updates `exerciseId`
 * when given. An error from the database (a name already in use, say) is shown under the form and
 * the form stays open. Afterwards it goes to `backPath`, or to the new exercise.
 */
export function ExerciseForm({
  exerciseId,
  initial,
  backPath,
}: {
  readonly exerciseId: number | undefined;
  readonly initial: CustomExerciseDraft;
  readonly backPath: string;
}) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CustomExerciseDraft>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const primary = draft.primaryMuscles ?? [];

  const save = async () => {
    setIsSaving(true);
    setError(undefined);
    try {
      if (exerciseId === undefined) {
        const createdId = await database.createExercise(draft);
        void navigate(`/exercises/${createdId}`, { replace: true });
      } else {
        await database.updateExercise(exerciseId, draft);
        void navigate(backPath, { replace: true });
      }
    } catch (failure) {
      log.ui.error('Saving an exercise failed', failure);
      setError(messageOf(failure));
      setIsSaving(false);
    }
  };

  return (
    <>
      <Section label="Details">
        <ExerciseDetailsFields draft={draft} onChange={setDraft} />
      </Section>
      <MusclePicker
        label="Primary muscles"
        footnote="The muscles that do most of the work. Pick at least one."
        selected={primary}
        onToggle={(muscle) => setDraft(withPrimaryToggled(draft, muscle))}
      />
      <MusclePicker
        label="Secondary muscles"
        selected={draft.secondaryMuscles ?? []}
        unavailable={primary}
        onToggle={(muscle) => setDraft(withSecondaryToggled(draft, muscle))}
      />
      <div className={styles.actions}>
        {error !== undefined && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button variant="primary" isDisabled={isSaving || !canSaveDraft(draft)} onPress={() => void save()}>
          Save
        </Button>
      </div>
    </>
  );
}
