import { Link } from 'react-router';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import { isTimedExercise } from './isTimedExercise';
import { targetText } from './targetText';
import styles from './WorkoutPage.module.css';

/** Compact exercise summary with a separate link to its workout-specific detail. */
export function WorkoutExerciseRow({
  exercise,
  detail,
  to,
}: {
  readonly exercise: TemplateExerciseDraft;
  readonly detail: ExerciseCatalogDetail | null | undefined;
  readonly to: string;
}) {
  const name = detail?.exercise.name ?? 'Archived exercise';
  const muscles =
    detail?.primaryMuscles.map((muscle) => MUSCLE_DISPLAY_NAMES[muscle]).join(', ') || 'No main muscle set';
  const targets = [
    ...new Set(exercise.sets.map((set) => targetText(set, isTimedExercise(detail?.exercise.tracking))).filter(Boolean)),
  ];
  const secondary = [muscles, ...targets, exercise.machineBrand].filter(Boolean).join(' · ');
  return (
    <div className={styles.row}>
      <span className={styles.rowText}>
        <strong>
          {exercise.sets.length} × {name}
        </strong>
        <span className={styles.secondary}>{secondary}</span>
      </span>
      <Link className={styles.info} to={to} aria-label={`Open ${name} in workout`}>
        ?
      </Link>
    </div>
  );
}
