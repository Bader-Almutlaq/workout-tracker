import { useState } from 'react';
import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import styles from './DropboxBackupSection.module.css';

/** Copy-code completion stays in this phone's memory; codes are neither persisted nor logged. */
export function DropboxCodeForm({ disabled }: { readonly disabled: boolean }) {
  const [code, setCode] = useState('');
  return (
    <form
      className={styles.codeForm}
      onSubmit={(event) => {
        event.preventDefault();
        const pastedCode = code;
        setCode('');
        void dropboxBackup.finishConnecting(pastedCode);
      }}
    >
      <label htmlFor="dropbox-code">Approve in Dropbox, copy the code it shows, and paste it here</label>
      <input
        id="dropbox-code"
        className={styles.codeInput}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
      />
      <button className={styles.finish} type="submit" disabled={disabled || code.trim().length === 0}>
        Finish connecting
      </button>
    </form>
  );
}
