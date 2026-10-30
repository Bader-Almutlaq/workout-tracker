import * as Comlink from 'comlink';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { daysSinceBackup } from '../../../core/backup/BackupAge';
import { parseBackupFileName } from '../../../core/backup/BackupFile';
import { database, messageOf, useDatabaseQuery } from '../../data/database';
import { Section, SectionRow } from '../../design/components/Section';
import styles from './BackupSection.module.css';

/** Media type for the backup file. iOS Files and the share sheet use it to treat the file as a database. */
const BACKUP_MEDIA_TYPE = 'application/vnd.sqlite3';

/** How long a download link's temporary address stays valid. Long enough for Safari to start the download. */
const DOWNLOAD_LINK_LIFETIME_MS = 60_000;

const BYTES_PER_MEGABYTE = 1024 * 1024;

/** A backup file the owner picked, waiting for them to confirm replacing the current data. */
interface PickedBackup {
  readonly name: string;
  readonly bytes: Uint8Array;
}

/** The outcome of the last action, shown under the buttons. */
interface Notice {
  readonly tone: 'good' | 'bad';
  readonly text: string;
}

/**
 * Back up and restore, in Settings.
 *
 * **Why the file is prepared before the tap:** iOS Safari only opens the share sheet from inside the tap
 * itself, and its "user gesture" is gone after the first `await` on a slow call. The worker therefore
 * builds the backup file as soon as this section shows (and again after every change), and the tap
 * handler calls `navigator.share` with no `await` before it.
 */
export function BackupSection() {
  const lastBackupAt = useDatabaseQuery('last-backup', () => database.lastBackupAt());
  const backupFile = useDatabaseQuery('backup-file', async () => {
    const { fileName, bytes } = await database.exportBackup();
    return new File([bytes as BlobPart], fileName, { type: BACKUP_MEDIA_TYPE });
  });
  const [picked, setPicked] = useState<PickedBackup | undefined>();
  const [isRestoring, setIsRestoring] = useState(false);
  const [notice, setNotice] = useState<Notice | undefined>();
  const fileInput = useRef<HTMLInputElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = confirmDialog.current;
    if (dialog === null) return;
    if (picked !== undefined && !dialog.open) dialog.showModal();
    if (picked === undefined && dialog.open) dialog.close();
  }, [picked]);

  const recordBackup = () =>
    database.recordBackupMade().then(
      () => setNotice({ tone: 'good', text: 'Backup saved.' }),
      (error: unknown) => setNotice({ tone: 'bad', text: `The backup was saved but not recorded: ${messageOf(error)}` }),
    );

  // No `await` before `navigator.share`: it must run inside the tap (see the component comment).
  const backUp = () => {
    if (backupFile.status !== 'ready') return;
    const file = backupFile.value;
    setNotice(undefined);
    if (canShareFile(file)) {
      navigator.share({ files: [file] }).then(recordBackup, (error: unknown) => {
        // Closing the share sheet is a cancel, not a failure, and counts as not backed up.
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setNotice({ tone: 'bad', text: `The backup was not saved: ${messageOf(error)}` });
      });
    } else {
      download(file);
      void recordBackup();
    }
  };

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) return;
    setNotice(undefined);
    try {
      setPicked({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    } catch (error) {
      setNotice({ tone: 'bad', text: `That file could not be read: ${messageOf(error)}` });
    }
  };

  const restore = async () => {
    if (picked === undefined) return;
    const { bytes } = picked;
    setPicked(undefined);
    setIsRestoring(true);
    try {
      const result = await database.restoreBackup(Comlink.transfer(bytes, [bytes.buffer as ArrayBuffer]));
      setNotice({
        tone: 'good',
        text: `Restored ${result.workoutCount.toLocaleString()} workouts. Your previous data is kept as a safety snapshot on this phone.`,
      });
    } catch (error) {
      setNotice({ tone: 'bad', text: messageOf(error) });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Section
        label="Backup"
        footnote="Back up saves a copy of everything to Files; choose the same iCloud Drive folder each time. Restore replaces what is on this phone."
      >
        <SectionRow label="Last backup" value={describeLastBackup(lastBackupAt)} />
        <button type="button" className={styles.action} disabled={backupFile.status !== 'ready' || isRestoring} onClick={backUp}>
          {backupFile.status === 'loading' ? 'Preparing…' : 'Back up'}
        </button>
        <button type="button" className={styles.action} disabled={isRestoring} onClick={() => fileInput.current?.click()}>
          {isRestoring ? 'Restoring…' : 'Restore from a backup file…'}
        </button>
        <input ref={fileInput} type="file" accept=".sqlite" hidden onChange={(event) => void pick(event)} />
      </Section>
      {backupFile.status === 'failed' && (
        <Message tone="bad" text={`A backup could not be prepared: ${backupFile.message}`} />
      )}
      {notice !== undefined && <Message tone={notice.tone} text={notice.text} />}

      <dialog ref={confirmDialog} className={styles.dialog} onClose={() => setPicked(undefined)} aria-labelledby="restore-title">
        <h2 id="restore-title" className={styles.dialogTitle}>
          Restore this backup?
        </h2>
        <p className={styles.dialogText}>
          Replace all current data with this backup? Your current data is kept as a safety snapshot on this phone first.
        </p>
        {picked !== undefined && <p className={styles.dialogFile}>{describePicked(picked)}</p>}
        <div className={styles.dialogButtons}>
          <button type="button" className={styles.dialogButton} onClick={() => setPicked(undefined)}>
            Cancel
          </button>
          <button type="button" className={`${styles.dialogButton} ${styles.destructive}`} onClick={() => void restore()}>
            Replace data
          </button>
        </div>
      </dialog>
    </>
  );
}

/** A result line with an icon, so colour is never the only signal. */
function Message({ tone, text }: Notice) {
  const Icon = tone === 'good' ? CircleCheck : CircleAlert;
  return (
    <p className={`${styles.message} ${tone === 'good' ? styles.good : styles.bad}`} role={tone === 'good' ? 'status' : 'alert'}>
      <Icon className={styles.messageIcon} aria-hidden="true" size={16} />
      <span>{text}</span>
    </p>
  );
}

/** Whether this browser can hand `file` to the share sheet (iOS Safari can; most desktop browsers can't). */
function canShareFile(file: File): boolean {
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
}

/** Saves `file` through a temporary link, for browsers without a share sheet. */
function download(file: File): void {
  const address = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = address;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(address), DOWNLOAD_LINK_LIFETIME_MS);
}

function describeLastBackup(query: ReturnType<typeof useDatabaseQuery<string | undefined>>): string {
  if (query.status === 'loading') return '…';
  if (query.status === 'failed') return query.message;
  const days = daysSinceBackup(query.value, new Date());
  if (days === undefined) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function describePicked(picked: PickedBackup): string {
  const madeAt = parseBackupFileName(picked.name);
  const size = `${(picked.bytes.byteLength / BYTES_PER_MEGABYTE).toFixed(1)} MB`;
  return madeAt === undefined ? `${picked.name} (${size})` : `${picked.name} (${size}), made ${madeAt.toLocaleString()}`;
}
