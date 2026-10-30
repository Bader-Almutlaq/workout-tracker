import { daysSinceBackup } from '../../../core/backup/BackupAge';
import { isBackupStale } from '../../../core/backup/BackupReminder';
import { database, useDatabaseQuery } from '../../data/database';
import { useBackupFile } from '../settings/useBackupFile';
import styles from './BackupReminderLine.module.css';

/** A quiet backup reminder after a saved workout, with the same sharing flow as Settings. */
export function BackupReminderLine() {
  const lastBackup = useDatabaseQuery('last-backup', () => database.lastBackupAt());
  const { file, notice, backUp } = useBackupFile();
  if (lastBackup.status === 'failed') return <p role="alert">{lastBackup.message}</p>;
  if (lastBackup.status !== 'ready' || !isBackupStale(lastBackup.value, new Date())) return null;

  const days = daysSinceBackup(lastBackup.value, new Date());
  const label = days === undefined ? 'Never backed up' : `Last backup ${days} days ago`;
  return (
    <div className={styles.reminder}>
      <div className={styles.line}>
        <span>{label}</span>
        <button type="button" className={styles.action} disabled={file.status !== 'ready'} onClick={backUp}>
          {file.status === 'loading' ? 'Preparing…' : 'Back up'}
        </button>
      </div>
      {file.status === 'failed' && <p role="alert">A backup could not be prepared: {file.message}</p>}
      {notice?.tone === 'bad' && <p role="alert">{notice.text}</p>}
    </div>
  );
}
