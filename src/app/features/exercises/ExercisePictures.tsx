import { ExercisePicture } from './ExercisePicture';
import { exercisePictureUrls, savedExercisePictures } from './picturePreference';
import styles from './ExercisePictures.module.css';

/** Optional start/end frames. Requests are made only when pictures are enabled. */
export function ExercisePictures({ imageKeys }: { readonly imageKeys: string | null | undefined }) {
  if (!savedExercisePictures()) return null;
  const urls = exercisePictureUrls(imageKeys);
  return (
    <div className={styles.pictures} aria-label="Exercise pictures">
      {urls.map((url, index) => (
        <ExercisePicture key={url} url={url} label={index === 0 ? 'Start' : 'End'} />
      ))}
    </div>
  );
}
