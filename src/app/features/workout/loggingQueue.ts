import { useSyncExternalStore } from 'react';
import { LoggingActionQueue } from './LoggingActionQueue';

/**
 * The one queue every logging write goes through, whichever screen makes it, so taps are applied in
 * the order they were made.
 */
export const loggingQueue = new LoggingActionQueue();

/** The latest failed write, for a banner; `undefined` when there is none. Re-renders when it changes. */
export function useLoggingError(): string | undefined {
  return useSyncExternalStore(loggingQueue.subscribe, loggingQueue.errorMessage);
}
