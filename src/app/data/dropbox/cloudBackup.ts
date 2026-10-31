import { log } from '../../../core/support/log';
import { database } from '../database';
import { DropboxApi } from './DropboxApi';
import { DropboxBackup } from './DropboxBackup';
import { effectiveDropboxAppKey } from './effectiveDropboxAppKey';
import { DropboxTokenStore } from './DropboxTokenStore';
import { settingsRedirectUri } from './pkce';

const tokens = new DropboxTokenStore();
let appKey: string;
try {
  appKey = effectiveDropboxAppKey(tokens);
} catch {
  // Never use a possibly wrong client key with an existing token when storage is inaccessible.
  log.backup.error('The Dropbox app key could not be read on this phone. Check website storage.');
  appKey = '';
}

/** The one cloud coordinator, eagerly loaded with the workout/Settings routes, independent of mounted screens. */
export const dropboxBackup = new DropboxBackup(appKey, database, tokens, new DropboxApi(appKey, tokens));

/** The current deployment's Settings callback, shared by authorize, exchange and the advanced setup text. */
export const dropboxRedirectUri = settingsRedirectUri(window.location.origin, import.meta.env.BASE_URL);

/** Whether this page load is Dropbox sending the owner back, so Settings can scroll to the result. */
export const returnedFromDropbox = ['code', 'state', 'error'].some((parameter) =>
  new URL(window.location.href).searchParams.has(parameter),
);

// Read and scrub the callback before initialize can discard an expired pending step or retry an upload.
void dropboxBackup.handleRedirect(dropboxRedirectUri, window.location.href, (url) => {
  window.history.replaceState(window.history.state, '', url);
});

// Listen even without a key, so adding one during this session enables online retries.
window.addEventListener('online', () => void dropboxBackup.retryPending());
void dropboxBackup.initialize();
