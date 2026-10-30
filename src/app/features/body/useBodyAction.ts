import { useState } from 'react';
import { log } from '../../../core/support/log';
import { messageOf } from '../../data/database';

/** Runs one sheet action at a time and keeps failed writes visible and logged. */
export function useBodyAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<unknown>, onSuccess: () => void) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      onSuccess();
    } catch (failure) {
      log.ui.error('Body measurement action failed', failure);
      setError(messageOf(failure));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, dismiss: () => setError(null), run };
}
