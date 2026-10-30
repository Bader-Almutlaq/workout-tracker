import { DropboxError } from './DropboxError';

/** One localStorage key, outside SQLite and every backup. Access tokens and PKCE verifiers are never persisted. */
const REFRESH_TOKEN_KEY = 'workout-tracker.dropbox.refresh-token';

/** Stores this phone's refresh token, guarding even access to Safari's localStorage getter. */
export class DropboxTokenStore {
  constructor(private readonly storage: () => Storage = () => window.localStorage) {}

  /** The saved refresh token, or undefined before connecting; blocked storage is a readable failure. */
  read(): string | undefined {
    try {
      return this.storage().getItem(REFRESH_TOKEN_KEY) || undefined;
    } catch {
      throw new DropboxError('storage', 'Dropbox credentials could not be read on this phone. Check website storage.');
    }
  }

  /** Persist a refresh token before treating the connection as usable. */
  write(refreshToken: string): void {
    try {
      this.storage().setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      throw new DropboxError(
        'storage',
        'Dropbox could not stay connected because this phone could not save its credentials.',
      );
    }
  }

  /** Remove only Dropbox's credentials; never touches workout data or Dropbox files. */
  clear(): void {
    try {
      this.storage().removeItem(REFRESH_TOKEN_KEY);
    } catch {
      throw new DropboxError(
        'storage',
        'Dropbox credentials could not be removed from this phone. Try Disconnect again.',
      );
    }
  }
}
