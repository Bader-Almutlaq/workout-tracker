import * as Comlink from 'comlink';
import { backupFileName } from '../core/backup/BackupFile';
import { validateBackup } from '../core/backup/BackupValidation';
import type { OnDeviceStore, OpenReport } from './OnDeviceStore';

/** Called after any write, so screens can re-run their queries. */
export type ChangeListener = () => void;

/** Basic facts about the database, shown in Settings. */
export interface DatabaseSummary {
  readonly workoutCount: number;
  readonly exerciseCount: number;
  readonly snapshotCount: number;
  readonly openReport: OpenReport;
}

/** A complete copy of the database, ready to be saved as a file. */
export interface BackupExport {
  /** `WorkoutTracker-YYYY-MM-DDTHH-mm-ss.sqlite`, named for the moment it was made. */
  readonly fileName: string;
  /** The whole database as one SQLite file. */
  readonly bytes: Uint8Array;
}

/** What a restore did, for the screen to report. */
export interface RestoreResult {
  /** Name of the safety snapshot holding the data as it was before the restore. */
  readonly snapshotName: string;
  /** Finished workouts in the restored data. */
  readonly workoutCount: number;
}

/**
 * `appSetting` key holding the ISO time of the last completed backup.
 * Read and written with plain SQL until `AppSetting` (T-013) merges; the lead then moves this key into it.
 */
const LAST_BACKUP_AT_KEY = 'lastBackupAt';

/**
 * Everything the screen can ask of the database. Each method maps to one WorkoutCore call.
 *
 * Conventions for adding a method:
 * - Reads return plain data (no class instances), because results are copied between threads.
 * - Writes notify every listener once they succeed (`notifyListeners()`), so every open screen refreshes.
 * - Errors are thrown as-is; the app shows their message to the owner.
 * - Get the store with `await liveStore()` and read `store.database` straight after it, never keeping
 *   the database across an `await`: a restore swaps the connection.
 */
export function createWorkerApi(ready: Promise<OnDeviceStore>) {
  const listeners = new Map<number, ChangeListener>();
  let nextSubscriptionId = 1;

  const notifyListeners = () => {
    for (const listener of listeners.values()) listener();
  };

  /** The open store, once any restore in progress has finished. */
  const liveStore = async (): Promise<OnDeviceStore> => {
    const store = await ready;
    await store.whenIdle();
    return store;
  };

  return {
    /** Resolves once the database is open and migrated; rejects with the reason it couldn't open. */
    async whenReady(): Promise<OpenReport> {
      return (await ready).openReport;
    },

    /**
     * Registers `listener` to run after every write and returns a subscription id for `unsubscribe`.
     * (An id rather than the listener itself, because a listener sent between threads arrives as a new object each time.)
     */
    subscribe(listener: ChangeListener): number {
      const id = nextSubscriptionId++;
      listeners.set(id, listener);
      return id;
    },

    unsubscribe(subscriptionId: number): void {
      listeners.delete(subscriptionId);
    },

    async summary(): Promise<DatabaseSummary> {
      const store = await liveStore();
      const db = store.database;
      return {
        workoutCount: db.value<number>('SELECT count(*) FROM workout WHERE isInProgress = 0') ?? 0,
        exerciseCount: db.value<number>('SELECT count(*) FROM exercise WHERE isArchived = 0') ?? 0,
        snapshotCount: store.snapshotNames().length,
        openReport: store.openReport,
      };
    },

    // Backup (T-016)

    /**
     * A complete copy of the database and the file name to save it under. The copy is checked the
     * way a restore would check it, so the owner is never handed a backup that can't be restored.
     * The bytes are moved to the caller, not copied.
     */
    async exportBackup(): Promise<BackupExport> {
      const store = await liveStore();
      const bytes = store.database.exportBytes();
      await validateBackup(bytes);
      return Comlink.transfer({ fileName: backupFileName(new Date()), bytes }, [bytes.buffer]);
    },

    /** ISO time of the last backup the owner completed, or `undefined` if none yet. */
    async lastBackupAt(): Promise<string | undefined> {
      const store = await liveStore();
      return store.database.value<string>('SELECT value FROM appSetting WHERE key = ?', [LAST_BACKUP_AT_KEY]);
    },

    /** Records that a backup was just saved. Call only after the share sheet or download succeeded. */
    async recordBackupMade(): Promise<void> {
      const store = await liveStore();
      store.database.run(
        'INSERT INTO appSetting (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
        [LAST_BACKUP_AT_KEY, new Date().toISOString()],
      );
      notifyListeners();
    },

    /**
     * Replaces all current data with a backup file (see `OnDeviceStore.restore`): checks the file,
     * keeps a safety snapshot, swaps the data, then refreshes every open screen.
     * Throws a `BackupError` whose message says what happened to the data.
     */
    async restoreBackup(bytes: Uint8Array): Promise<RestoreResult> {
      const store = await liveStore();
      const report = await store.restore(bytes);
      notifyListeners();
      return {
        snapshotName: report.snapshotName,
        workoutCount: store.database.value<number>('SELECT count(*) FROM workout WHERE isInProgress = 0') ?? 0,
      };
    },
  };
}

/** The API as the screen sees it. */
export type WorkerApi = ReturnType<typeof createWorkerApi>;
