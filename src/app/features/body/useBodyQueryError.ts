import { useEffect } from 'react';
import { log } from '../../../core/support/log';
import type { QueryState } from '../../data/database';

/** Logs measurement query failures while the caller renders their readable message. */
export function useBodyQueryError(query: QueryState<unknown>): void {
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load measurements', query.message);
  }, [query]);
}
