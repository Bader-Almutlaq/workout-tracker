import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { MIGRATIONS, migrate } from '../db/migrations';
import { BackupError } from './BackupError';
import { restoreBackup, type LiveDatabaseStorage } from './BackupRestore';

const NOW = new Date('2026-10-30T13:05:00.000Z');

/** The phone's file system, in memory: a live file plus named snapshots. */
class InMemoryStorage implements LiveDatabaseStorage {
  live: Uint8Array;
  readonly snapshots = new Map<string, Uint8Array>();
  connection: Database | undefined;
  /** Number of upcoming `replaceLive` calls that should fail after clobbering the file, like a half-written import. */
  failReplaces = 0;
  failSnapshot = false;

  constructor(live: Uint8Array) {
    this.live = live;
  }

  async saveSnapshot(bytes: Uint8Array, now: Date): Promise<string> {
    if (this.failSnapshot) throw new Error('No space left');
    const name = `/snapshot-${now.toISOString()}.sqlite`;
    this.snapshots.set(name, bytes);
    return name;
  }

  closeLive(): void {
    this.connection?.close();
    this.connection = undefined;
  }

  async replaceLive(bytes: Uint8Array): Promise<void> {
    if (this.failReplaces > 0) {
      this.failReplaces -= 1;
      this.live = new Uint8Array();
      throw new Error('Disk write failed');
    }
    this.live = bytes;
  }

  async openLive(): Promise<Database> {
    this.connection = await Database.fromBytes(this.live);
    return this.connection;
  }
}

async function databaseWith(workoutName: string, migrations = MIGRATIONS): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db, NOW, migrations);
  db.run("INSERT INTO workout (startedAt, name, source) VALUES ('2026-10-01T10:00:00.000Z', ?, 'app')", [workoutName]);
  return db;
}

function workoutNames(db: Database): string[] {
  return db.all<{ name: string }>('SELECT name FROM workout ORDER BY id').map((row) => row.name);
}

function connectionOf(storage: InMemoryStorage): Database {
  if (storage.connection === undefined) throw new Error('The live database is not open');
  return storage.connection;
}

async function setUp(): Promise<{ storage: InMemoryStorage; live: Database; backup: Uint8Array }> {
  const live = await databaseWith('Current data');
  const storage = new InMemoryStorage(live.exportBytes());
  storage.connection = live;
  const source = await databaseWith('From the backup');
  const backup = source.exportBytes();
  source.close();
  return { storage, live, backup };
}

/** The characters of `text` as bytes (core has no `TextEncoder`; ASCII is enough here). */
function asBytes(text: string): Uint8Array {
  return Uint8Array.from(text, (character) => character.charCodeAt(0));
}

describe('restoreBackup', () => {
  test('replaces the data and keeps a snapshot of what was there', async () => {
    const { storage, live, backup } = await setUp();

    const report = await restoreBackup(storage, live, backup, NOW);

    expect(workoutNames(connectionOf(storage))).toEqual(['From the backup']);
    expect(report.appliedMigrations).toEqual([]);
    const snapshot = storage.snapshots.get(report.snapshotName);
    expect(snapshot).toBeDefined();
    expect(workoutNames(await Database.fromBytes(snapshot ?? new Uint8Array()))).toEqual(['Current data']);
  });

  test('migrates a backup made by an older version', async () => {
    const { storage, live } = await setUp();
    const older = await databaseWith('Old backup');
    const newer = [...MIGRATIONS, { id: 'v2-extra', sql: 'CREATE TABLE extra (a TEXT)' }];

    const report = await restoreBackup(storage, live, older.exportBytes(), NOW, newer);

    expect(report.appliedMigrations).toEqual(['v2-extra']);
    expect(connectionOf(storage).value("SELECT count(*) FROM sqlite_master WHERE name = 'extra'")).toBe(1);
  });

  test('a file that is not a backup changes nothing and takes no snapshot', async () => {
    const { storage, live } = await setUp();
    const before = storage.live;

    await expect(restoreBackup(storage, live, asBytes('not a database'), NOW)).rejects.toMatchObject({
      kind: 'notABackup',
    });

    expect(storage.live).toBe(before);
    expect(storage.snapshots.size).toBe(0);
    expect(workoutNames(live)).toEqual(['Current data']);
  });

  test('a backup from a newer app version changes nothing and takes no snapshot', async () => {
    const { storage, live } = await setUp();
    const future = await databaseWith('Future');
    future.run("INSERT INTO migration (id, appliedAt) VALUES ('v99-future', '2030-01-01T00:00:00.000Z')");

    await expect(restoreBackup(storage, live, future.exportBytes(), NOW)).rejects.toMatchObject({ kind: 'newerVersion' });

    expect(storage.snapshots.size).toBe(0);
    expect(workoutNames(live)).toEqual(['Current data']);
  });

  test('if the snapshot cannot be saved, nothing is changed and the live connection stays open', async () => {
    const { storage, live, backup } = await setUp();
    storage.failSnapshot = true;
    const before = storage.live;

    await expect(restoreBackup(storage, live, backup, NOW)).rejects.toMatchObject({ kind: 'snapshotFailed' });

    expect(storage.live).toBe(before);
    expect(workoutNames(live)).toEqual(['Current data']);
  });

  test('if replacing the data fails, the previous data is put back and the error names the snapshot', async () => {
    const { storage, live, backup } = await setUp();
    storage.failReplaces = 1;

    const failure = await restoreBackup(storage, live, backup, NOW).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(BackupError);
    expect((failure as BackupError).kind).toBe('restoreFailed');
    const snapshotName = [...storage.snapshots.keys()][0] ?? '';
    expect((failure as BackupError).message).toContain(snapshotName);
    expect((failure as BackupError).message).toContain('put back');
    expect(workoutNames(connectionOf(storage))).toEqual(['Current data']);
  });

  test('if putting the data back fails too, the error points at the snapshot, which holds the data', async () => {
    const { storage, live, backup } = await setUp();
    storage.failReplaces = 2;

    const failure = await restoreBackup(storage, live, backup, NOW).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(BackupError);
    const snapshotName = [...storage.snapshots.keys()][0] ?? '';
    expect((failure as BackupError).message).toContain(snapshotName);
    expect((failure as BackupError).message).toContain('could not be put back');
    const snapshot = storage.snapshots.get(snapshotName);
    expect(workoutNames(await Database.fromBytes(snapshot ?? new Uint8Array()))).toEqual(['Current data']);
  });
});
