import { cloudBackupPathsToDelete } from '../../../core/backup/CloudRetention';
import { log } from '../../../core/support/log';
import type { BackupExport, CloudBackupSettings, CloudBackupSettingsUpdate } from '../../../worker/WorkerApi';
import { DropboxApi } from './DropboxApi';
import { DropboxError } from './DropboxError';
import { DropboxTokenStore } from './DropboxTokenStore';
import { effectiveDropboxAppKey } from './effectiveDropboxAppKey';
import { authorizationUrl, createVerifier, verifierChallenge } from './pkce';

/** The shared view state; credentials and the verifier never appear here. */
export interface DropboxBackupState {
  readonly enabled: boolean;
  readonly phase: 'loading' | 'idle' | 'authorizing' | 'backingUp' | 'disconnecting';
  readonly connected: boolean;
  readonly awaitingCode: boolean;
  readonly reconnect: boolean;
  readonly lastBackupAt: string | undefined;
  readonly message: string | undefined;
}

/** Only the existing validated export and non-secret worker settings are available to cloud orchestration. */
export interface DropboxBackupDatabase {
  exportBackup(): Promise<BackupExport>;
  cloudBackupSettings(): Promise<CloudBackupSettings>;
  updateCloudBackupSettings(change: CloudBackupSettingsUpdate): Promise<void>;
}

/** A tab opened synchronously inside the tap, before awaiting the PKCE hash. */
export interface DropboxAuthorizationWindow {
  navigate(url: string): void;
  close(): void;
}

/**
 * Serializes connection, upload, retention, and disconnect for the lifetime of the open app.
 * Each public action reports failures in shared state and logs safe messages, never raw network errors.
 */
export class DropboxBackup {
  private state: DropboxBackupState;
  private readonly listeners = new Set<() => void>();
  private tail: Promise<void> = Promise.resolve();
  private verifier: string | undefined;

  constructor(
    private appKey: string,
    private readonly database: DropboxBackupDatabase,
    private readonly tokens: DropboxTokenStore,
    private readonly api: DropboxApi,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.state = {
      enabled: appKey.length > 0,
      phase: appKey.length > 0 ? 'loading' : 'idle',
      connected: false,
      awaitingCode: false,
      reconnect: false,
      lastBackupAt: undefined,
      message: undefined,
    };
  }

  /** Stable snapshot for React's external-store subscription. */
  readonly snapshot = (): DropboxBackupState => this.state;

  /** Observe shared state even while the owner changes screens. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** On app open reconcile this phone's token with restored metadata, then silently retry a pending export. */
  initialize(): Promise<void> {
    return this.run(async () => {
      const settings = await this.database.cloudBackupSettings();
      const connected = this.tokens.read() !== undefined;
      this.update({ connected, lastBackupAt: settings.lastCloudBackupAt, reconnect: !connected && settings.pending });
      await this.database.updateCloudBackupSettings({ provider: connected ? 'dropbox' : null });
      if (connected && settings.pending) await this.upload();
    });
  }

  /** Open a tab inside the tap; keep the verifier only in this instance, and show the copy-code field. */
  beginConnect(open: () => DropboxAuthorizationWindow | null): Promise<void> {
    if (!this.state.enabled) return Promise.resolve();
    let popup: DropboxAuthorizationWindow | null;
    try {
      popup = open();
    } catch {
      popup = null;
    }
    this.update({ phase: 'authorizing' });
    return this.run(async () => {
      if (popup === null)
        throw new DropboxError('connection', 'Allow a new tab to open, then try Connect Dropbox again.');
      this.update({ message: undefined });
      try {
        this.verifier = createVerifier();
        const challenge = await verifierChallenge(this.verifier);
        popup.navigate(authorizationUrl(this.appKey, challenge));
        this.update({ awaitingCode: true });
      } catch {
        popup.close();
        this.verifier = undefined;
        throw new DropboxError('connection', 'Dropbox could not open securely. Try Connect again.');
      }
    });
  }

  /** Exchange the pasted code, persist the connection, and upload its first full backup immediately. */
  finishConnecting(code: string): Promise<void> {
    return this.run(async () => {
      const verifier = this.verifier;
      this.verifier = undefined;
      this.update({ awaitingCode: false, phase: 'authorizing' });
      if (verifier === undefined || code.trim().length === 0) {
        throw new DropboxError('code', "That code didn't work; codes expire after a few minutes. Try Connect again.");
      }
      await this.api.exchange(code.trim(), verifier);
      this.update({ connected: true, reconnect: false });
      await this.database.updateCloudBackupSettings({ provider: 'dropbox', pending: true });
      await this.upload();
    });
  }

  /** Explicit retry from Settings or the finish summary. Never throws into the workout finish flow. */
  backUp(): Promise<void> {
    return this.run(() => this.upload());
  }

  /** Saved workouts trigger an upload only when this phone holds a refresh token. Finishing never awaits it. */
  afterWorkout(): Promise<void> {
    return this.run(async () => {
      if (this.tokens.read() !== undefined) await this.upload();
    });
  }

  /** Online events retry only pending work; a network change never uploads an unconnected database. */
  retryPending(): Promise<void> {
    return this.run(async () => {
      if (this.tokens.read() !== undefined && (await this.database.cloudBackupSettings()).pending) await this.upload();
    });
  }

  /** Revoke before forgetting credentials; on network failure retain them so Disconnect can be retried. */
  disconnect(): Promise<void> {
    return this.run(async () => {
      this.update({ phase: 'disconnecting', message: undefined });
      await this.api.revoke();
      this.verifier = undefined;
      this.update({ connected: false, reconnect: false, awaitingCode: false, lastBackupAt: undefined });
      await this.database.updateCloudBackupSettings({ provider: null, pending: false, lastCloudBackupAt: null });
    });
  }

  /** Save a device key only after revoking the old connection; an empty key selects the default. */
  saveAppKey(key: string): Promise<void> {
    return this.run(async () => {
      const trimmed = key.trim();
      // An empty value explicitly removes the override, so compare against the built-in default.
      const selectedKey = trimmed || effectiveDropboxAppKey(undefined);
      if (selectedKey !== this.appKey && this.tokens.read() !== undefined) {
        this.update({ phase: 'disconnecting', message: undefined });
        await this.api.revoke();
        this.update({ connected: false, reconnect: false, awaitingCode: false, lastBackupAt: undefined });
        await this.database.updateCloudBackupSettings({ provider: null, pending: false, lastCloudBackupAt: null });
      }
      this.tokens.writeAppKey(trimmed);
      this.verifier = undefined;
      this.appKey = selectedKey;
      this.api.setAppKey(this.appKey);
      this.update({ enabled: this.appKey.length > 0, awaitingCode: false, message: undefined });
    }, true);
  }

  private async upload(): Promise<void> {
    this.update({ phase: 'backingUp', message: undefined });
    await this.database.updateCloudBackupSettings({ pending: true });
    const backup = await this.database.exportBackup();
    await this.api.upload(backup.fileName, backup.bytes);
    const uploadedAt = this.now().toISOString();
    this.update({ lastBackupAt: uploadedAt, connected: true, reconnect: false });
    try {
      for (const path of cloudBackupPathsToDelete(await this.api.list())) await this.api.delete(path);
    } catch (error) {
      // The file is safe in Dropbox even when retention fails; still satisfy the manual reminder.
      await this.database.updateCloudBackupSettings({ lastCloudBackupAt: uploadedAt });
      throw error;
    }
    // A later workout or edit must retain its retry flag if it arrived during this upload.
    await this.database.updateCloudBackupSettings({
      lastCloudBackupAt: uploadedAt,
      pending: false,
      completedExportVersion: backup.changeVersion,
    });
  }

  private run(operation: () => Promise<void>, allowDisabled = false): Promise<void> {
    if (!this.state.enabled && !allowDisabled) return Promise.resolve();
    const result = this.tail.then(async () => {
      try {
        await operation();
        this.update({ phase: 'idle' });
      } catch (error) {
        const failure =
          error instanceof DropboxError
            ? error
            : new DropboxError(
                'storage',
                'The Dropbox backup could not be prepared or recorded on this phone. Try again.',
              );
        log.backup.error(failure.message);
        if (failure.kind === 'revoked') this.update({ connected: false, reconnect: true, awaitingCode: false });
        this.update({ phase: 'idle', message: failure.message });
        try {
          await this.database.updateCloudBackupSettings({
            pending: true,
            ...(failure.kind === 'revoked' ? { provider: null } : {}),
          });
        } catch {
          log.backup.error('The pending Dropbox backup could not be recorded on this phone.');
          this.update({
            message: `${failure.message} The pending retry could not be saved; try again before closing the app.`,
          });
        }
      }
    });
    this.tail = result;
    return result;
  }

  private update(change: Partial<DropboxBackupState>): void {
    this.state = { ...this.state, ...change };
    for (const listener of this.listeners) listener();
  }
}
