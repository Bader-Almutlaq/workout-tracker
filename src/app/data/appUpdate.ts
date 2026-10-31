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

/**
 * When to look for a new version besides start-up. Heuristic: iOS resumes a Home Screen app instead of
 * restarting it, so a check at start-up alone can miss updates for days.
 */
export const UpdateCheckSchedule = Object.freeze({
  /** While the app stays open, check this often (one hour). */
  intervalMilliseconds: 60 * 60 * 1000,
});

/** Asks the browser to fetch the service worker again; a new version then triggers "Update ready". */
function checkForUpdate(registration: ServiceWorkerRegistration): void {
  // Offline, the check can only fail; the installed version keeps working.
  if (!navigator.onLine) return;
  registration.update().catch((error: unknown) => log.ui.error('Checking for an app update failed', error));
}

/** Checks whenever the app comes back to the screen, and hourly while it stays open. */
function watchForUpdates(registration: ServiceWorkerRegistration): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate(registration);
  });
  setInterval(() => checkForUpdate(registration), UpdateCheckSchedule.intervalMilliseconds);
}

/** Registers the service worker. Call once at startup. */
export function startOfflineSupport(): void {
  applyUpdate = registerSW({
    onNeedRefresh() {
      isUpdateReady = true;
      for (const listener of listeners) listener();
    },
    onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      if (registration !== undefined) watchForUpdates(registration);
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
