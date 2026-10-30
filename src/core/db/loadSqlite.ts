import sqlite3InitModule, { type Sqlite3Static } from '@sqlite.org/sqlite-wasm';

let loading: Promise<Sqlite3Static> | undefined;

/**
 * Loads the SQLite WebAssembly module once per thread and returns it.
 * Loading takes tens of milliseconds, so every caller shares the first load.
 */
export function loadSqlite(): Promise<Sqlite3Static> {
  loading ??= sqlite3InitModule();
  return loading;
}
