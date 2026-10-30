import { useState } from 'react';
import { database, messageOf, useDatabaseQuery } from '../../data/database';

/** Media type recognized by iOS Files for a SQLite database. */
const BACKUP_MEDIA_TYPE = 'application/vnd.sqlite3';
/** Time allowed for Safari to start a download before its temporary URL is revoked. */
const DOWNLOAD_LINK_LIFETIME_MS = 60_000;

/** Prepares a backup before the tap and shares or downloads it, recording successful actions. */
export function useBackupFile() {
  const file = useDatabaseQuery('backup-file', async () => {
    const { fileName, bytes } = await database.exportBackup();
    // The worker returns a Uint8Array backed by an ordinary ArrayBuffer suitable for a Blob.
    return new File([bytes as BlobPart], fileName, { type: BACKUP_MEDIA_TYPE });
  });
  const [notice, setNotice] = useState<{ readonly tone: 'good' | 'bad'; readonly text: string }>();

  const recordBackup = () =>
    database.recordBackupMade().then(
      () => setNotice({ tone: 'good', text: 'Backup saved.' }),
      (error: unknown) =>
        setNotice({ tone: 'bad', text: `The backup was saved but not recorded: ${messageOf(error)}` }),
    );

  // iOS requires the share call in the tap handler, before any await.
  const backUp = () => {
    if (file.status !== 'ready') return;
    setNotice(undefined);
    if (canShareFile(file.value)) {
      navigator.share({ files: [file.value] }).then(recordBackup, (error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setNotice({ tone: 'bad', text: `The backup was not saved: ${messageOf(error)}` });
      });
    } else {
      download(file.value);
      void recordBackup();
    }
  };

  return { file, notice, backUp, clearNotice: () => setNotice(undefined) };
}

function canShareFile(file: File): boolean {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

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
