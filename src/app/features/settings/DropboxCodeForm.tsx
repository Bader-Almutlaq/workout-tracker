import { useState } from 'react';
import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import styles from './DropboxBackupSection.module.css';

/** Copy-code completion stays in this phone's memory; codes are neither persisted nor logged. */
export function DropboxCodeForm({
  disabled,
  awaitingCode,
  message,
}: {
  readonly disabled: boolean;
  readonly awaitingCode: boolean;
  readonly message: string | undefined;
}) {
  const [code, setCode] = useState('');
  return (
    <form
      className={styles.codeForm}
      onSubmit={(event) => {
        event.preventDefault();
        void dropboxBackup.finishConnecting(code);
      }}
    >
      <label htmlFor="dropbox-code" className={awaitingCode ? undefined : styles.inactive}>
        2. Paste the code Dropbox shows
      </label>
      <input
        id="dropbox-code"
        className={styles.codeInput}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled || !awaitingCode}
        aria-describedby={
          message !== undefined ? 'dropbox-code-error' : !awaitingCode ? 'dropbox-code-hint' : undefined
        }
        aria-invalid={message !== undefined}
      />
      {message !== undefined && (
        <p id="dropbox-code-error" className={styles.error} role="alert">
          {message}
        </p>
      )}
      {!awaitingCode && (
        <p id="dropbox-code-hint" className={styles.inactive}>
          Open Dropbox first.
        </p>
      )}
      <button className={styles.finish} type="submit" disabled={disabled || !awaitingCode || code.trim().length === 0}>
        Connect
      </button>
    </form>
  );
}
