import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import { Button } from '../../design/components/Button';
import { exerciseNameOf } from './exerciseNames';
import { PreviewExercise } from './PreviewExercise';
import styles from './TemplatePreview.module.css';

/** The body of the preview sheet: the template's notes and exercises, then Start and Edit. */
export function TemplatePreview({
  template,
  names,
  isBusy,
  onStart,
  onEdit,
}: {
  readonly template: TemplateDraft;
  readonly names: ReadonlyMap<number, string>;
  readonly isBusy: boolean;
  readonly onStart: () => void;
  readonly onEdit: () => void;
}) {
  return (
    <>
      {template.notes !== null && <p className={styles.notes}>{template.notes}</p>}
      {template.exercises.map((exercise, index) => (
        // The same exercise can be in a template twice, so its position is the only identity it has.
        <PreviewExercise key={index} exercise={exercise} name={exerciseNameOf(names, exercise.exerciseId)} />
      ))}
      <div className={styles.actions}>
        <Button variant="primary" isDisabled={isBusy} onPress={onStart}>
          Start
        </Button>
        <Button onPress={onEdit}>Edit</Button>
      </div>
    </>
  );
}
