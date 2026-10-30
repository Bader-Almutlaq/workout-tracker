/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import { loadSqlite } from '../core/db/loadSqlite';
import { log } from '../core/support/log';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';

/**
 * The database worker: the only place the live database is opened.
 * The screen talks to it through `WorkerApi` (see `src/app/data/database.ts`), so queries never
 * block scrolling or typing.
 */
const ready = (async () => {
  const sqlite = await loadSqlite();
  const store = await OnDeviceStore.open(sqlite);
  return store;
})();

ready.catch((error: unknown) => log.database.error('Opening the database failed', error));

Comlink.expose(createWorkerApi(ready));
