import { database } from '../database';
import { DROPBOX_APP_KEY } from '../dropboxConfig';
import { DropboxApi } from './DropboxApi';
import { DropboxBackup } from './DropboxBackup';
import { DropboxTokenStore } from './DropboxTokenStore';

const tokens = new DropboxTokenStore();

/** The one cloud coordinator, eagerly loaded with the workout/Settings routes, independent of mounted screens. */
export const dropboxBackup = new DropboxBackup(
  DROPBOX_APP_KEY,
  database,
  tokens,
  new DropboxApi(DROPBOX_APP_KEY, tokens),
);

// Route modules load at app startup. An empty key performs no storage access, subscriptions, or network calls.
if (dropboxBackup.snapshot().enabled) {
  window.addEventListener('online', () => void dropboxBackup.retryPending());
  void dropboxBackup.initialize();
}
