import { Link } from 'react-router';
import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import { dropboxCaption } from '../../data/dropbox/dropboxCaption';
import { useDropboxBackup } from '../../data/dropbox/useDropboxBackup';
import styles from './DropboxBackupLine.module.css';

/** Live cloud progress after Finish; the parent keeps the existing share-sheet backup available. */
export function DropboxBackupLine() {
  const state = useDropboxBackup();
  if (!state.enabled || (!state.connected && !state.reconnect && state.message === undefined)) return null;
  return (
    <div className={styles.line}>
      <p role={state.message === undefined ? 'status' : 'alert'}>{dropboxCaption(state, new Date(), true)}</p>
      {state.message !== undefined && state.connected && state.phase === 'idle' && (
        <button type="button" className={styles.retry} onClick={() => void dropboxBackup.backUp()}>
          Try again
        </button>
      )}
      {state.reconnect && (
        <Link className={styles.retry} to="/settings">
          Reconnect Dropbox
        </Link>
      )}
    </div>
  );
}
