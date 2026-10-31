import { useEffect } from 'react';
import { log } from '../../../core/support/log';
import type { QueryState } from '../../data/database';
import styles from './ExerciseDetailScreen.module.css';

/** Visible and logged query failure, or a quiet loading message for any exercise section. */
export function ExerciseQueryMessage({ query }: { readonly query: QueryState<unknown> }) {
  useEffect(() => {
    if (query.status === 'failed') log.ui.error('Could not load exercise section', query.message);
  }, [query]);
  if (query.status === 'ready') return null;
  return (
    <p className={styles.note} role={query.status === 'failed' ? 'alert' : 'status'}>
      {query.status === 'failed' ? query.message : 'Loading…'}
    </p>
  );
}
