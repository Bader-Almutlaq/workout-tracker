import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { MIGRATIONS, migrate } from '../db/migrations';
import { BackupError } from './BackupError';
import { validateBackup } from './BackupValidation';

/** SQLite's default page size, which in-memory test databases use. */
const TEST_PAGE_BYTES = 4096;

async function backupBytes(change: (db: Database) => void = () => undefined): Promise<Uint8Array> {
  const db = await Database.openInMemory();
  migrate(db);
  change(db);
  const bytes = db.exportBytes();
  db.close();
  return bytes;
}

async function kindOfFailure(bytes: Uint8Array, migrations = MIGRATIONS): Promise<string | undefined> {
  try {
    await validateBackup(bytes, migrations);
    return undefined;
  } catch (error) {
    if (error instanceof BackupError) return error.kind;
    throw error;
  }
}

/** The characters of `text` as bytes (core has no `TextEncoder`; ASCII is enough here). */
function asBytes(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

describe('validateBackup', () => {
  test('accepts a real backup', async () => {
    const bytes = await backupBytes((db) =>
      db.run("INSERT INTO workout (startedAt, name, source) VALUES ('2026-10-01T10:00:00.000Z', 'Push', 'app')"),
    );
    await expect(validateBackup(bytes)).resolves.toBeUndefined();
  });

  test('rejects garbage bytes', async () => {
    const garbage = new Uint8Array(4096).map((_, index) => (index * 31) % 251);
    expect(await kindOfFailure(garbage)).toBe('notABackup');
  });

  test('rejects an empty file and a text file', async () => {
    expect(await kindOfFailure(new Uint8Array())).toBe('notABackup');
    expect(await kindOfFailure(asBytes('Date,Workout Name\n2026-01-01,Push\n'))).toBe('notABackup');
  });

  test('rejects a SQLite file that is not ours', async () => {
    const other = await Database.openInMemory();
    other.exec('CREATE TABLE notes (text TEXT); INSERT INTO notes VALUES (\'hello\')');
    const bytes = other.exportBytes();
    other.close();
    expect(await kindOfFailure(bytes)).toBe('notABackup');
  });

  test('rejects a backup from a newer version of the app', async () => {
    const bytes = await backupBytes((db) =>
      db.run("INSERT INTO migration (id, appliedAt) VALUES ('v99-future', '2030-01-01T00:00:00.000Z')"),
    );
    expect(await kindOfFailure(bytes)).toBe('newerVersion');
  });

  test('rejects a backup missing tables and names them', async () => {
    const bytes = await backupBytes((db) => db.exec('DROP TABLE workoutSet; DROP TABLE bodyMeasurement'));
    expect(await kindOfFailure(bytes)).toBe('missingTables');
    await expect(validateBackup(bytes)).rejects.toThrow(/bodyMeasurement, workoutSet|workoutSet, bodyMeasurement/);
  });

  test('rejects a file whose data pages are damaged', async () => {
    const bytes = await backupBytes((db) => {
      for (let index = 0; index < 300; index += 1) {
        db.run("INSERT INTO workout (startedAt, name, source) VALUES (?, 'Push', 'app')", [`2026-01-01T10:00:${index}`]);
      }
    });
    const damaged = bytes.slice();
    // Overwrite one whole page after the first (which holds the header and schema) with 0xFF bytes.
    damaged.fill(0xff, TEST_PAGE_BYTES * 2, TEST_PAGE_BYTES * 3);
    expect(await kindOfFailure(damaged)).toBe('damaged');
  });

  test('accepts an older backup that needs migrating, and rejects one that cannot be migrated', async () => {
    const bytes = await backupBytes();
    const withNewer = [...MIGRATIONS, { id: 'v2-extra', sql: 'CREATE TABLE extra (a TEXT)' }];
    expect(await kindOfFailure(bytes, withNewer)).toBeUndefined();

    const withBroken = [...MIGRATIONS, { id: 'v2-broken', sql: 'SELECT * FROM missing' }];
    expect(await kindOfFailure(bytes, withBroken)).toBe('damaged');
  });

  test('does not modify the bytes it is given', async () => {
    const bytes = await backupBytes();
    const before = bytes.slice();
    await validateBackup(bytes, [...MIGRATIONS, { id: 'v2-extra', sql: 'CREATE TABLE extra (a TEXT)' }]);
    expect(bytes).toEqual(before);
  });
});
