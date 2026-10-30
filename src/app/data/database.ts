import * as Comlink from 'comlink';
import { useEffect, useEffectEvent, useState } from 'react';
import type { WorkerApi } from '../../worker/WorkerApi';

/**
 * The screen's handle on the database worker. Every call is async because it crosses threads.
 * There is exactly one worker per open app.
 */
export const database: Comlink.Remote<WorkerApi> = Comlink.wrap<WorkerApi>(
  new Worker(new URL('../../worker/database.worker.ts', import.meta.url), { type: 'module' }),
);

/** The state of a query as a screen renders it. */
export type QueryState<Value> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly value: Value }
  | { readonly status: 'failed'; readonly message: string };

/**
 * Runs `query` against the database and re-runs it after every write, so the screen stays current.
 * `key` names the query and its arguments (for example `exercise-${id}`): when it changes, the query re-runs.
 */
export function useDatabaseQuery<Value>(key: string, query: () => Promise<Value>): QueryState<Value> {
  const [state, setState] = useState<QueryState<Value>>({ status: 'loading' });
  const run = useEffectEvent(query);

  useEffect(() => {
    let isCurrent = true;
    const refresh = () => {
      run().then(
        (value) => isCurrent && setState({ status: 'ready', value }),
        (error: unknown) => isCurrent && setState({ status: 'failed', message: messageOf(error) }),
      );
    };
    refresh();
    const subscription = database.subscribe(Comlink.proxy(refresh));
    return () => {
      isCurrent = false;
      void subscription.then((id) => database.unsubscribe(id));
    };
  }, [key]);

  return state;
}

/** A message the owner can read for any thrown value. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
