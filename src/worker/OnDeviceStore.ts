import type { SAHPoolUtil, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { Database } from '../core/db/Database';
import { DatabaseError } from '../core/db/DatabaseError';
import { migrate, pendingMigrationIds } from '../core/db/migrations';
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
 * (data safety rule in `AGENTS.md`), and pruning old snapshots.
 */
export class OnDeviceStore {
  private constructor(
    private readonly pool: SAHPoolUtil,
    readonly database: Database,
    readonly openReport: OpenReport,
  ) {}

  /** Opens (creating if needed) the live database and brings its schema up to date. */
  static async open(sqlite: Sqlite3Static, now: Date = new Date()): Promise<OnDeviceStore> {
    let pool: SAHPoolUtil;
    try {
      pool = await sqlite.installOpfsSAHPoolVfs({ name: POOL_NAME });
      await pool.reserveMinimumCapacity(OnDeviceStoreLimits.minimumPoolCapacity);
    } catch (error) {
      throw new DatabaseError('open', 'This browser could not open on-device storage.', error);
    }

    const database = Database.wrap(new pool.OpfsSAHPoolDb(LIVE_DATABASE), sqlite);
    const pending = pendingMigrationIds(database);
    const hasData = (database.value<number>("SELECT count(*) FROM sqlite_master WHERE name = 'workout'") ?? 0) > 0;

    let snapshotName: string | undefined;
    if (pending.length > 0 && hasData) {
      snapshotName = await OnDeviceStore.takeSnapshot(pool, database, now);
    }
    const appliedMigrations = migrate(database, now);
    if (appliedMigrations.length > 0) {
      log.database.info(`Applied migrations: ${appliedMigrations.join(', ')}`);
    }
    return new OnDeviceStore(pool, database, { appliedMigrations, snapshotName });
  }

  /** Names of the safety snapshots on the phone, newest first. */
  snapshotNames(): string[] {
    return OnDeviceStore.snapshotsIn(this.pool);
  }

  /** Copies the live database into a new snapshot and prunes the oldest. Returns the snapshot name. */
  takeSnapshot(now: Date = new Date()): Promise<string> {
    return OnDeviceStore.takeSnapshot(this.pool, this.database, now);
  }

  private static async takeSnapshot(pool: SAHPoolUtil, database: Database, now: Date): Promise<string> {
    const name = `${SNAPSHOT_PREFIX}${now.toISOString().replaceAll(':', '-')}.sqlite`;
    await pool.importDb(name, database.exportBytes());
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
