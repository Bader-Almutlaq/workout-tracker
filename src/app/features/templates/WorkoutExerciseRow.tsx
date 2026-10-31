import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';
import { MUSCLE_DISPLAY_NAMES } from '../../../core/library/Muscle';
import type { TemplateExerciseDraft } from '../../../core/templates/TemplateDraft';
import { ExercisePicture } from '../exercises/ExercisePicture';
import { savedExercisePictures, selectedExercisePictures } from '../exercises/picturePreference';
import { isTimedExercise } from './isTimedExercise';
import { setRunsText } from './setRunsText';
import styles from './WorkoutPage.module.css';

/** One exercise on the workout page: a small picture, "3 × name", main muscle and planned sets. Opens the exercise inside this workout. */
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
  const muscles = detail?.primaryMuscles.map((muscle) => MUSCLE_DISPLAY_NAMES[muscle]).join(', ') ?? '';
  const brand = exercise.machineBrand === null ? '' : ` · ${exercise.machineBrand}`;
  const pictures =
    detail === null || detail === undefined
      ? { urls: [], drawings: false }
      : selectedExercisePictures(detail.exercise.libraryKey, detail.exercise.imageKeys, savedExercisePictures());
  const first = pictures.urls[0];
  return (
    <Link className={styles.row} to={to}>
      <div className={styles.picture}>
        {first !== undefined && <ExercisePicture url={first} label={name} drawing={pictures.drawings} />}
      </div>
      <span className={styles.rowText}>
        <strong>
          {exercise.sets.length} × {name}
        </strong>
        <span className={styles.secondary}>{`${muscles || 'No main muscle set'}${brand}`}</span>
        <span className={styles.secondary}>
          {setRunsText(exercise.sets, isTimedExercise(detail?.exercise.tracking))}
        </span>
      </span>
      <ChevronRight size={20} aria-hidden />
    </Link>
  );
}
