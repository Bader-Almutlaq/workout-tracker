import { log } from '../../core/support/log';

/**
 * Asks the browser to never clear this app's storage under disk pressure.
 * iOS grants it to apps added to the Home Screen. Returns whether storage is persistent.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (await navigator.storage.persisted()) return true;
    const granted = await navigator.storage.persist();
    log.database.info(`Persistent storage ${granted ? 'granted' : 'not granted'}`);
    return granted;
  } catch (error) {
    log.database.error('Asking for persistent storage failed', error);
    return false;
  }
}
