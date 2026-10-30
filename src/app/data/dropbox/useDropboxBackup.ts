import { useSyncExternalStore } from 'react';
import { dropboxBackup } from './cloudBackup';

/** Subscribe to the app-lifetime coordinator; moving between screens never cancels a backup. */
export function useDropboxBackup() {
  return useSyncExternalStore(dropboxBackup.subscribe, dropboxBackup.snapshot);
}
