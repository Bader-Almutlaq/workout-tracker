import { Link } from 'react-router';
import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import { dropboxCaption, dropboxStatusTone } from '../../data/dropbox/dropboxCaption';
import { useDropboxBackup } from '../../data/dropbox/useDropboxBackup';
import styles from './DropboxBackupLine.module.css';

/** Live cloud progress after Finish; the parent keeps the existing share-sheet backup available. */
export function DropboxBackupLine() {
  const state = useDropboxBackup();
  if (!state.enabled) return null;
  const tone = dropboxStatusTone(state);
  return (
    <div className={styles.line}>
      <p data-status={tone} role={tone === 'bad' ? 'alert' : 'status'}>
        {tone === 'good' && <span aria-hidden="true">✓ </span>}
        {tone === 'bad' && <span aria-hidden="true">! </span>}
        {dropboxCaption(state, new Date())}
      </p>
      {state.notice !== undefined && <p role="status">{state.notice}</p>}
      {state.message !== undefined && state.connected && state.phase === 'idle' && (
        <button type="button" className={styles.retry} onClick={() => void dropboxBackup.backUp()}>
          Try again
        </button>
      )}
      {!state.connected && state.phase === 'idle' && (
        <Link className={styles.retry} to="/settings">
          {state.reconnect ? 'Reconnect Dropbox' : 'Connect Dropbox'}
        </Link>
      )}
    </div>
  );
}
