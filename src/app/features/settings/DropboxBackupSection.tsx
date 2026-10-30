import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import { dropboxCaption } from '../../data/dropbox/dropboxCaption';
import { useDropboxBackup } from '../../data/dropbox/useDropboxBackup';
import { Section } from '../../design/components/Section';
import { DropboxCodeForm } from './DropboxCodeForm';
import styles from './DropboxBackupSection.module.css';

/** Optional automatic backups; an empty app key renders nothing and cannot initiate a connection. */
export function DropboxBackupSection() {
  const state = useDropboxBackup();
  if (!state.enabled) return null;
  const busy = state.phase !== 'idle';
  const connect = () => {
    void dropboxBackup.beginConnect(() => {
      // Open synchronously in the tap: awaiting SHA-256 first loses iOS Safari's user activation.
      const popup = window.open('about:blank', '_blank');
      if (popup === null) return null;
      popup.opener = null;
      return {
        navigate: (url) => {
          popup.location.href = url;
        },
        close: () => popup.close(),
      };
    });
  };
  return (
    <Section
      label="Dropbox"
      footnote="Automatic full backups go only to this app’s folder in your Dropbox. Disconnect never deletes your files."
    >
      <p className={styles.caption} role={state.message === undefined ? 'status' : 'alert'}>
        {dropboxCaption(state, new Date())}
      </p>
      {state.connected ? (
        <>
          <button className={styles.action} type="button" disabled={busy} onClick={() => void dropboxBackup.backUp()}>
            Back up to Dropbox now
          </button>
          <button
            className={styles.action}
            type="button"
            disabled={busy}
            onClick={() => void dropboxBackup.disconnect()}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button className={styles.action} type="button" disabled={busy} onClick={connect}>
          {state.reconnect ? 'Reconnect Dropbox' : 'Connect Dropbox'}
        </button>
      )}
      {state.awaitingCode && <DropboxCodeForm disabled={busy} />}
    </Section>
  );
}
