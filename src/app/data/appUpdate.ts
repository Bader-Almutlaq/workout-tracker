import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { log } from '../../core/support/log';

/**
 * Offline support and updates.
 *
 * The service worker stores the whole app on the phone, so it opens with no connection. When a new
 * version has downloaded, the app does not reload on its own (that could interrupt a workout): it
 * shows "Update ready" and waits for a tap. If the download fails, the version already installed keeps working.
 */
let isUpdateReady = false;
const listeners = new Set<() => void>();
let applyUpdate: (() => Promise<void>) | undefined;

/** Registers the service worker. Call once at startup. */
export function startOfflineSupport(): void {
  applyUpdate = registerSW({
    onNeedRefresh() {
      isUpdateReady = true;
      for (const listener of listeners) listener();
    },
    onRegisterError(error: unknown) {
      log.ui.error('Offline support could not start', error);
    },
  });
}

/** Whether a new version is downloaded and waiting. Re-renders when that changes. */
export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => isUpdateReady,
  );
}

/** Switches to the downloaded version (reloads the app). */
export function installUpdate(): void {
  void applyUpdate?.();
}
