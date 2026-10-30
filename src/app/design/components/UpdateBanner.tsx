import { installUpdate, useUpdateReady } from '../../data/appUpdate';
import styles from './UpdateBanner.module.css';

/** A quiet bar above the tabs when a new version is ready. Never shown otherwise. */
export function UpdateBanner() {
  const isUpdateReady = useUpdateReady();
  if (!isUpdateReady) return null;
  return (
    <div className={styles.banner} role="status">
      <span>Update ready</span>
      <button type="button" className={styles.action} onClick={installUpdate}>
        Update
      </button>
    </div>
  );
}
