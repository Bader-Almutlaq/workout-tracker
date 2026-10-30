import type { SAHPoolUtil, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { restoreBackup, type LiveDatabaseStorage, type RestoreReport } from '../core/backup/BackupRestore';
import { Database } from '../core/db/Database';
import { DatabaseError } from '../core/db/DatabaseError';
import { migrate, pendingMigrationIds } from '../core/db/migrations';
import { ExerciseLibrary } from '../core/library/ExerciseLibrary';
import { ExerciseLibrarySeeder } from '../core/library/ExerciseLibrarySeeder';
import { log } from '../core/support/log';

/** Storage limits for the on-device file pool. */
export const OnDeviceStoreLimits = {
  /**
   * Local safety snapshots kept on the phone; older ones are deleted when a new one is taken.
   * Heuristic: enough to step back a few bad updates without filling the pool. Cloud backups are the long-term copy.
   */
  snapshotsKept: 3,
  /**
   * Files the pool keeps open: the live database and its journal, SQLite temp files, the snapshots,
   * and one spare for a restore in progress. Heuristic, from the pool's own guidance (one entry per file).
   */
  minimumPoolCapacity: 10,
  /**
   * Attempts to open the storage before giving up. Only one copy of the app can hold it at a time;
   * right after "Update", or with the app open in a second tab, the other copy may need a moment to
   * let go. Heuristic: 8 attempts 750 ms apart cover a reload with time to spare.
   */
  openAttempts: 8,
  /** Wait between open attempts, in milliseconds. See `openAttempts`. */
  openRetryDelayMilliseconds: 750,
} as const;

/** Name of the pool in the browser's private file system. Never change it: the data lives under this name. */
const POOL_NAME = 'workout-tracker';
const LIVE_DATABASE = '/workouts.sqlite';
const SNAPSHOT_PREFIX = '/snapshot-';

/** What happened when the database was opened. */
export interface OpenReport {
  /** Migrations applied on this launch, in order. Empty on most launches. */
  readonly appliedMigrations: readonly string[];
  /** Name of the safety snapshot taken before migrating, if one was needed. */
  readonly snapshotName: string | undefined;
}

/**
 * The database file on the phone, kept in the browser's private file system (OPFS) through
 * SQLite's "SAH pool" storage. That storage needs no special server headers and works in
 * Safari on iOS 16.4 and later.
 *
 * Owns opening the live database, taking a safety snapshot before pending migrations
 * (data safety rule in `AGENTS.md`), pruning old snapshots, and restoring a backup.
 */
export class OnDeviceStore {
  private liveDatabase: Database | undefined;
  /** Settles (never rejects) when the running restore ends; `undefined` when none is running. */
  private restoreInProgress: Promise<void> | undefined;

  private constructor(
    private readonly pool: SAHPoolUtil,
    private readonly sqlite: Sqlite3Static,
    database: Database,
    readonly openReport: OpenReport,
  ) {
    this.liveDatabase = database;
  }

  /** Opens (creating if needed) the live database and brings its schema up to date. */
  static async open(sqlite: Sqlite3Static, now: Date = new Date()): Promise<OnDeviceStore> {
    const pool = await openPool(sqlite);

    const database = Database.wrap(new pool.OpfsSAHPoolDb(LIVE_DATABASE), sqlite);
    const pending = pendingMigrationIds(database);
    const hasData = (database.value<number>("SELECT count(*) FROM sqlite_master WHERE name = 'workout'") ?? 0) > 0;

    let snapshotName: string | undefined;
    if (pending.length > 0 && hasData) {
      snapshotName = await OnDeviceStore.saveSnapshot(pool, database.exportBytes(), now);
    }
    const appliedMigrations = migrate(database, now);
    if (appliedMigrations.length > 0) {
      log.database.info(`Applied migrations: ${appliedMigrations.join(', ')}`);
    }
    seedLibrary(database, now);
    return new OnDeviceStore(pool, sqlite, database, { appliedMigrations, snapshotName });
  }

  /**
   * The live database. It changes after a restore, so callers read it afresh each time and never keep it.
   * Throws while a restore has it closed; `await whenIdle()` first.
   */
  get database(): Database {
    if (this.liveDatabase === undefined) {
      throw new DatabaseError('open', 'The data is being restored. Try again in a moment.');
    }
    return this.liveDatabase;
  }

  /** Resolves when no restore is running. Await it, then read `database` in the same step. */
  async whenIdle(): Promise<void> {
    await this.restoreInProgress;
  }

  /** Names of the safety snapshots on the phone, newest first. */
  snapshotNames(): string[] {
    return OnDeviceStore.snapshotsIn(this.pool);
  }

  /** Copies the live database into a new snapshot and prunes the oldest. Returns the snapshot name. */
  takeSnapshot(now: Date = new Date()): Promise<string> {
    return OnDeviceStore.saveSnapshot(this.pool, this.database.exportBytes(), now);
  }

  /**
   * Replaces the live data with a backup file's bytes: validate, snapshot, replace, reopen, migrate
   * (see `restoreBackup`). While it runs, other calls wait on `whenIdle`, so nothing writes to the
   * database between the snapshot and the replacement.
   * @throws BackupError. Its message says what happened to the data and names the snapshot once one exists.
   */
  async restore(bytes: Uint8Array, now: Date = new Date()): Promise<RestoreReport> {
    if (this.restoreInProgress !== undefined) {
      throw new DatabaseError('open', 'A restore is already running.');
    }
    const live = this.database;
    const storage: LiveDatabaseStorage = {
      saveSnapshot: (snapshotBytes, at) => OnDeviceStore.saveSnapshot(this.pool, snapshotBytes, at),
      closeLive: () => {
        this.liveDatabase = undefined;
        live.close();
      },
      replaceLive: (replacement) => this.replaceLiveFile(replacement),
      openLive: () => {
        const reopened = Database.wrap(new this.pool.OpfsSAHPoolDb(LIVE_DATABASE), this.sqlite);
        this.liveDatabase = reopened;
        return Promise.resolve(reopened);
      },
    };
    const running = restoreBackup(storage, live, bytes, now);
    this.restoreInProgress = running.then(
      () => undefined,
      () => undefined,
    );
    try {
      const report = await running;
      // A backup from an older version may predate the current library.
      seedLibrary(this.database, now);
      return report;
    } finally {
      this.restoreInProgress = undefined;
    }
  }

  /** Overwrites the live file. A leftover journal is removed first: SQLite would replay it into the new content. */
  private async replaceLiveFile(bytes: Uint8Array): Promise<void> {
    for (const leftover of [`${LIVE_DATABASE}-journal`, `${LIVE_DATABASE}-wal`]) {
      if (this.pool.getFileNames().includes(leftover)) this.pool.unlink(leftover);
    }
    await this.pool.importDb(LIVE_DATABASE, bytes);
  }

  private static async saveSnapshot(pool: SAHPoolUtil, bytes: Uint8Array, now: Date): Promise<string> {
    const name = `${SNAPSHOT_PREFIX}${now.toISOString().replaceAll(':', '-')}.sqlite`;
    await pool.importDb(name, bytes);
    for (const old of OnDeviceStore.snapshotsIn(pool).slice(OnDeviceStoreLimits.snapshotsKept)) {
      pool.unlink(old);
    }
    log.database.info(`Safety snapshot taken: ${name}`);
    return name;
  }

  private static snapshotsIn(pool: SAHPoolUtil): string[] {
    return pool
      .getFileNames()
      .filter((name) => name.startsWith(SNAPSHOT_PREFIX))
      .sort()
      .reverse();
  }
}

/**
 * Copies the built-in exercise library into the database when its version changed (a no-op on
 * most launches). Seeding only adds rows and refreshes library fields, so it needs no snapshot.
 */
function seedLibrary(database: Database, now: Date): void {
  const result = ExerciseLibrarySeeder.seed(database, ExerciseLibrary.bundled(), now);
  if (!result.skipped) {
    log.database.info(`Library seeded: ${result.inserted} added, ${result.linked} linked, ${result.updated} updated`);
  }
}

/**
 * Opens the storage pool, retrying while another copy of the app still holds it.
 *
 * **Data safety:** by default SQLite *deletes the pool* when opening it fails. A failure here
 * usually means another tab holds the files, so deleting would destroy the owner's data.
 * `preserveOnInitFailure` keeps the files; `forceReinitIfPreviouslyFailed` lets a retry try again
 * instead of returning the cached failure.
 */
async function openPool(sqlite: Sqlite3Static): Promise<SAHPoolUtil> {
  // The two options exist in SQLite 3.54 but are missing from its TypeScript declarations.
  const options = {
    name: POOL_NAME,
    preserveOnInitFailure: true,
    forceReinitIfPreviouslyFailed: true,
  } as Parameters<Sqlite3Static['installOpfsSAHPoolVfs']>[0];
  let lastError: unknown;
  for (let attempt = 1; attempt <= OnDeviceStoreLimits.openAttempts; attempt += 1) {
    try {
      const pool = await sqlite.installOpfsSAHPoolVfs(options);
      await pool.reserveMinimumCapacity(OnDeviceStoreLimits.minimumPoolCapacity);
      return pool;
    } catch (error) {
      lastError = error;
      log.database.error(`Opening on-device storage failed (attempt ${attempt})`, error);
      await new Promise((resolve) => setTimeout(resolve, OnDeviceStoreLimits.openRetryDelayMilliseconds));
    }
  }
  throw new DatabaseError(
    'open',
    'Your data is safe, but the app could not open it because it is open somewhere else: another Safari tab, or the Home Screen app and Safari at the same time. Close the other copy, then close and reopen this one.',
    lastError,
  );
}
