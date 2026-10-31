import { useState } from 'react';
import styles from './ExercisePictures.module.css';

/** One source frame, hidden until it loads; unavailable offline frames leave no broken image. */
export function ExercisePicture({
  url,
  label,
  drawing,
}: {
  readonly url: string;
  readonly label: string;
  readonly drawing: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className={styles.frame} hidden={!loaded}>
      <img
        className={drawing ? styles.drawing : undefined}
        src={url}
        crossOrigin="anonymous"
        alt={label}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
