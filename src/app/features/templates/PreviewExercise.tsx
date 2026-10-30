import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import styles from './PreviewExercise.module.css';
import { setRunsText } from './setRunsText';

/** One exercise in the preview sheet: its name and its sets in a line. A superset's exercises share an accent edge. */
export function PreviewExercise({
  exercise,
  name,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly name: string;
}) {
  return (
    <div className={styles.exercise} data-superset={exercise.supersetGroup !== null}>
      <span className={styles.name}>{name}</span>
      <span className={styles.sets}>{setRunsText(exercise.sets)}</span>
    </div>
  );
}
