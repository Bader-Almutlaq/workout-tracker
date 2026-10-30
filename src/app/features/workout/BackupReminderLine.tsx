import { backupCaption, isBackupStale } from '../../../core/backup/BackupReminder';
import { database, useDatabaseQuery } from '../../data/database';
import { useBackupFile } from '../settings/useBackupFile';
import { DropboxBackupLine } from './DropboxBackupLine';
import styles from './BackupReminderLine.module.css';

/** Offers a backup after a saved workout using the same sharing flow as Settings. */
export function BackupReminderLine() {
  const lastBackup = useDatabaseQuery('last-backup', () => database.lastBackupAt());
  const { file, notice, backedUp, backUp } = useBackupFile();
  const now = new Date();
  const justBackedUp = backedUp;
  const stale = lastBackup.status === 'ready' && !justBackedUp && isBackupStale(lastBackup.value, now);
  return (
    <div className={styles.reminder}>
      <button type="button" className={styles.action} disabled={file.status !== 'ready'} onClick={backUp}>
        {file.status === 'loading' ? 'Preparing…' : 'Back up now'}
      </button>
      <DropboxBackupLine />
      {lastBackup.status === 'ready' && (
        <p className={stale ? styles.warning : styles.caption}>{backupCaption(lastBackup.value, now, justBackedUp)}</p>
      )}
      {lastBackup.status === 'failed' && <p role="alert">{lastBackup.message}</p>}
      {file.status === 'failed' && <p role="alert">A backup could not be prepared: {file.message}</p>}
      {notice?.tone === 'bad' && <p role="alert">{notice.text}</p>}
    </div>
  );
}
