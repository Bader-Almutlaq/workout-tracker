import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import styles from './PreviewExercise.module.css';
import { setRunsText } from './setRunsText';

/** One exercise in the preview sheet: its name and its sets in a line. A superset's exercises share an accent edge. */
export function PreviewExercise({
  exercise,
  name,
  isTimed,
  mainMuscle,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly name: string;
  readonly isTimed: boolean;
  readonly mainMuscle: string;
}) {
  return (
    <div className={styles.exercise} data-superset={exercise.supersetGroup !== null}>
      <span className={styles.name}>
        {exercise.sets.length} × {name}
      </span>
      <span className={styles.sets}>{mainMuscle}</span>
      <span className={styles.sets}>{setRunsText(exercise.sets, isTimed)}</span>
    </div>
  );
}
