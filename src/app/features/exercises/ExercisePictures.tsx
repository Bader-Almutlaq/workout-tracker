import { ExercisePicture } from './ExercisePicture';
import { savedExercisePictures, selectedExercisePictures } from './picturePreference';
import styles from './ExercisePictures.module.css';

/** Optional start/end frames; images are requested only when this view is shown. */
export function ExercisePictures({
  imageKeys,
  libraryKey,
}: {
  readonly imageKeys: string | null | undefined;
  readonly libraryKey: string | null;
}) {
  const selection = selectedExercisePictures(libraryKey, imageKeys, savedExercisePictures());
  if (selection.urls.length === 0) return null;
  return (
    <div className={styles.pictures} aria-label="Exercise pictures">
      {selection.urls.map((url, index) => (
        <ExercisePicture key={url} url={url} label={index === 0 ? 'Start' : 'End'} drawing={selection.drawings} />
      ))}
    </div>
  );
}
