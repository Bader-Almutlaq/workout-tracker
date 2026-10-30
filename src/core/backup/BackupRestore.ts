import type { Database } from '../db/Database';
import { MIGRATIONS, migrate, type Migration } from '../db/migrations';
import { log } from '../support/log';
import { BackupError } from './BackupError';
import { validateBackup } from './BackupValidation';

/**
 * Where the live database and its safety snapshots are kept. The worker implements it over the
 * phone's file system (`OnDeviceStore`); tests implement it in memory.
 */
export interface LiveDatabaseStorage {
  /** Saves `bytes` (a complete database file) as a new safety snapshot and returns its name. */
  saveSnapshot(bytes: Uint8Array, now: Date): Promise<string>;
  /** Closes the live connection. */
  closeLive(): void;
  /** Overwrites the live database file with `bytes`. The live connection is closed when this is called. */
  replaceLive(bytes: Uint8Array): Promise<void>;
  /** Opens the live database file and returns the new connection, which becomes the live one. */
  openLive(): Promise<Database>;
}

/** What a restore did. */
export interface RestoreReport {
  /** Name of the safety snapshot holding the data as it was before the restore. */
  readonly snapshotName: string;
  /** Migrations applied to the restored data because the backup was made by an older version. */
  readonly appliedMigrations: readonly string[];
}

/**
 * Replaces the live data with a backup, without any risk to the current data.
 *
 * Order (data safety rule in `AGENTS.md`):
 * 1. validate the backup (`validateBackup`): live data untouched on failure;
 * 2. save a safety snapshot of the live database: live data untouched on failure;
 * 3. close the live connection, overwrite the live file, reopen it and migrate it.
 *
 * If step 3 fails, the previous data is written back and reopened, so the app carries on with
 * what it had; the error then says so. If even that fails, the error tells the owner the
 * snapshot holds the data. Either way the snapshot is named in the message.
 *
 * Whatever happens, `storage.openLive` has been called last for the connection that should be used,
 * unless the error says the previous data could not be put back.
 *
 * @param live The current live connection (read for the snapshot, then closed).
 * @param migrations The schema to bring the restored data up to; tests pass a longer list.
 * @throws BackupError
 */
export async function restoreBackup(
  storage: LiveDatabaseStorage,
  live: Database,
  backupBytes: Uint8Array,
  now: Date = new Date(),
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<RestoreReport> {
  await validateBackup(backupBytes, migrations);

  const previousBytes = live.exportBytes();
  let snapshotName: string;
  try {
    snapshotName = await storage.saveSnapshot(previousBytes, now);
  } catch (error) {
    throw new BackupError(
      'snapshotFailed',
      'The safety snapshot of your current data could not be saved, so nothing was changed.',
      error,
    );
  }

  storage.closeLive();
  let restored: Database | undefined;
  try {
    await storage.replaceLive(backupBytes);
    restored = await storage.openLive();
    const appliedMigrations = migrate(restored, now, migrations);
    log.backup.info(`Restored a backup; safety snapshot ${snapshotName}`);
    return { snapshotName, appliedMigrations };
  } catch (error) {
    log.backup.error('Restore failed after the safety snapshot; putting the previous data back', error);
    restored?.close();
    await putPreviousDataBack(storage, previousBytes, snapshotName, error);
    throw new BackupError(
      'restoreFailed',
      `The restore failed, and your previous data was put back as it was. A safety snapshot (${snapshotName}) is also kept on this phone. (${reasonOf(error)})`,
      error,
    );
  }
}

/** Rolls back after a failed restore. Throws a `BackupError` pointing at the snapshot if that fails too. */
async function putPreviousDataBack(
  storage: LiveDatabaseStorage,
  previousBytes: Uint8Array,
  snapshotName: string,
  restoreError: unknown,
): Promise<void> {
  try {
    await storage.replaceLive(previousBytes);
    await storage.openLive();
  } catch (rollbackError) {
    log.backup.error('Putting the previous data back failed', rollbackError);
    throw new BackupError(
      'restoreFailed',
      `The restore failed and the previous data could not be put back automatically. Your data is safe in the snapshot ${snapshotName} on this phone. Close and reopen the app, then ask for help restoring that snapshot. (${reasonOf(restoreError)})`,
      rollbackError,
    );
  }
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
