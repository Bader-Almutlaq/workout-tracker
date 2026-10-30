import { useState } from 'react';
import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import styles from './DropboxBackupSection.module.css';

/** Device-specific Dropbox app setup, collapsed until requested when a key is available. */
export function DropboxAppKeyForm({ disabled, expanded }: { readonly disabled: boolean; readonly expanded: boolean }) {
  const [key, setKey] = useState('');
  return (
    <details className={styles.codeForm} open={expanded || undefined}>
      <summary>Use your own Dropbox app key</summary>
      <p>
        Create an app at <a href="https://www.dropbox.com/developers/apps">dropbox.com/developers/apps</a> with Scoped
        access and App folder. Enable files.metadata.read, files.content.write and files.content.read, then copy the App
        key. Saving a different key disconnects the current app; connect again afterwards.
      </p>
      <form
        className={styles.keyForm}
        onSubmit={(event) => {
          event.preventDefault();
          void dropboxBackup.saveAppKey(key);
        }}
      >
        <label htmlFor="dropbox-app-key">App key (leave blank to use the default)</label>
        <input
          id="dropbox-app-key"
          className={styles.codeInput}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={disabled}
        />
        <button className={styles.finish} type="submit" disabled={disabled}>
          Save
        </button>
      </form>
    </details>
  );
}
