import { DROPBOX_APP_KEY } from '../dropboxConfig';
import { DropboxTokenStore } from './DropboxTokenStore';

/** Select this device's saved public key, falling back to the built-in key. */
export function effectiveDropboxAppKey(store: DropboxTokenStore | undefined, builtInKey = DROPBOX_APP_KEY): string {
  return store?.readAppKey() ?? builtInKey;
}
