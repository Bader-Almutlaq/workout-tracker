import { Database } from '../db/Database';
import { DatabaseError } from '../db/DatabaseError';
import { MIGRATIONS, migrate, pendingMigrationIds, type Migration } from '../db/migrations';
import { BackupError } from './BackupError';

const TABLE_NAMES_SQL = "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'";

/** Names of the user tables in `db` (SQLite's own bookkeeping tables are left out). */
function tableNames(db: Database): Set<string> {
  return new Set(db.all<{ name: string }>(TABLE_NAMES_SQL).map((row) => row.name));
}

/**
 * Checks that `bytes` is a backup this version of the app can restore, without touching the live
 * database. Everything is checked on an in-memory copy:
 *
 * 1. it is a SQLite file (`notABackup`);
 * 2. it has this app's `migration` table with at least one applied migration (`notABackup`);
 * 3. SQLite's `quick_check` passes (`damaged`);
 * 4. it knows no migration this version doesn't (`newerVersion`), because opening newer data could corrupt it;
 * 5. migrating the copy up to date works (`damaged`), which proves the restore's final step will;
 * 6. afterwards it has every table a freshly created database has (`missingTables`).
 *
 * Older backups (fewer migrations) are valid: restoring migrates them.
 *
 * @param migrations The schema to check against; tests pass a longer list to simulate a future app version.
 * @throws BackupError describing the first problem found.
 */
export async function validateBackup(bytes: Uint8Array, migrations: readonly Migration[] = MIGRATIONS): Promise<void> {
  let backup: Database;
  try {
    backup = await Database.fromBytes(bytes);
  } catch (error) {
    throw new BackupError('notABackup', 'This file is not a Workout Tracker backup (it is not a SQLite database).', error);
  }

  try {
    inspect(backup, migrations);
    const present = tableNames(backup);
    const missing = [...(await expectedTableNames(migrations))].filter((name) => !present.has(name));
    if (missing.length > 0) {
      throw new BackupError('missingTables', `This backup is incomplete: it lacks ${missing.join(', ')}.`);
    }
  } finally {
    backup.close();
  }
}

/** Steps 2 to 5: everything that reads the backup. Migrates `backup` (the in-memory copy) up to date. */
function inspect(backup: Database, migrations: readonly Migration[]): void {
  try {
    const hasMigrationTable = tableNames(backup).has('migration');
    const appliedCount = hasMigrationTable ? (backup.value<number>('SELECT count(*) FROM migration') ?? 0) : 0;
    if (appliedCount === 0) {
      throw new BackupError('notABackup', 'This file is not a Workout Tracker backup (it has none of the app’s data).');
    }
    if (backup.value<string>('PRAGMA quick_check') !== 'ok') {
      throw new BackupError('damaged', 'This backup file is damaged (SQLite’s integrity check failed).');
    }
    pendingMigrationIds(backup, migrations);
    migrate(backup, new Date(), migrations);
  } catch (error) {
    if (error instanceof BackupError) throw error;
    if (error instanceof DatabaseError && error.kind === 'newerSchema') {
      throw new BackupError(
        'newerVersion',
        'This backup was made by a newer version of the app. Update the app, then restore it.',
        error,
      );
    }
    throw new BackupError('damaged', 'This backup file is damaged or cannot be brought up to date.', error);
  }
}

/** Tables a database made by `migrations` has. Built by running them, so the list can never go stale. */
async function expectedTableNames(migrations: readonly Migration[]): Promise<Set<string>> {
  const reference = await Database.openInMemory();
  try {
    migrate(reference, new Date(), migrations);
    return tableNames(reference);
  } finally {
    reference.close();
  }
}
