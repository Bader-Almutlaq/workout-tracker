import { useState } from 'react';
import styles from './ExercisePictures.module.css';

/** One source frame, hidden until it loads; unavailable offline frames leave no broken image. */
export function ExercisePicture({ url, label }: { readonly url: string; readonly label: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className={styles.frame} hidden={!loaded}>
      <img
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
