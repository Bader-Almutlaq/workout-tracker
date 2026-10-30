import { afterEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../core/db/Database';
import { DataSafetyFixture } from '../core/db/fixtures/DataSafetyFixture';
import { loadSqlite } from '../core/db/loadSqlite';
import { MIGRATIONS, migrate } from '../core/db/migrations';
import { OnDeviceStore, OnDeviceStoreLimits } from './OnDeviceStore';
import { MemoryDevice } from './fixtures/MemoryDevice';

const NOW = new Date('2026-10-30T12:00:00.000Z');
const LIVE_FILE = '/workouts.sqlite';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function deviceWithData() {
  const device = new MemoryDevice(await loadSqlite());
  const database = await Database.openInMemory();
  migrate(database);
  DataSafetyFixture.seed(database);
  device.files.set(LIVE_FILE, database.exportBytes());
  database.close();
  return device;
}

describe('opening on-device storage', () => {
  test('second-tab lock retries preserve existing files, including snapshots', async () => {
    vi.useFakeTimers();
    const device = await deviceWithData();
    const before = device.files.get(LIVE_FILE)?.slice();
    if (before === undefined) throw new Error('Missing synthetic live file');
    const snapshotName = '/snapshot-2026-10-01T00-00-00.000Z.sqlite';
    device.files.set(snapshotName, before.slice());
    const install = vi.mocked(device.sqlite.installOpfsSAHPoolVfs);
    install.mockRejectedValueOnce(new Error('Another tab holds the pool'));
    const opening = OnDeviceStore.open(device.sqlite, NOW);
    await vi.runAllTimersAsync();
    const store = await opening;
    expect(install).toHaveBeenCalledTimes(2);
    expect(device.files.get(snapshotName)).toEqual(before);
    expect(device.imports).toEqual([]);
    for (const [options] of install.mock.calls) {
      expect(options).toMatchObject({
        name: 'workout-tracker',
        preserveOnInitFailure: true,
        forceReinitIfPreviouslyFailed: true,
      });
    }
    expect(device.files.get(LIVE_FILE)).toEqual(before);
    expect(store.database.value('SELECT count(*) FROM workoutSet')).toBe(4);
    store.database.close();
  });

  test('an exhausted lock retry surfaces a clear error without writing or deleting files', async () => {
    vi.useFakeTimers();
    const device = await deviceWithData();
    const before = device.files.get(LIVE_FILE)?.slice();
    const install = vi.mocked(device.sqlite.installOpfsSAHPoolVfs).mockRejectedValue(new Error('Locked'));
    const failure = expect(OnDeviceStore.open(device.sqlite, NOW)).rejects.toMatchObject({
      kind: 'open',
      message: expect.stringContaining('Close the other copy'),
    });
    await vi.runAllTimersAsync();
    await failure;
    expect(install).toHaveBeenCalledTimes(OnDeviceStoreLimits.openAttempts);
    expect(device.files.get(LIVE_FILE)).toEqual(before);
    expect(device.imports).toEqual([]);
  });

  test('snapshots with identical timestamps never overwrite a previous safety copy', async () => {
    const device = await deviceWithData();
    const store = await OnDeviceStore.open(device.sqlite, NOW);
    const first = await store.takeSnapshot(NOW);
    const before = device.files.get(first)?.slice();
    store.database.run("UPDATE workout SET notes = 'Changed' WHERE id = 1");
    const second = await store.takeSnapshot(NOW);
    expect(second).not.toBe(first);
    expect(device.files.get(first)).toEqual(before);
    expect(store.snapshotNames()).toHaveLength(2);
    store.database.close();
  });

  test('a clock moving backwards cannot prune the snapshot just returned', async () => {
    const device = await deviceWithData();
    const store = await OnDeviceStore.open(device.sqlite, NOW);
    for (let index = 0; index < OnDeviceStoreLimits.snapshotsKept; index += 1) {
      await store.takeSnapshot(new Date(NOW.getTime() + index));
    }
    const latest = await store.takeSnapshot(new Date('2020-01-01T00:00:00Z'));
    expect(store.snapshotNames()[0]).toBe(latest);
    expect(device.files.has(latest)).toBe(true);
    store.database.close();
  });

  test('a failed migration snapshot leaves every row unchanged and closes the connection', async () => {
    const device = new MemoryDevice(await loadSqlite());
    const old = await Database.openInMemory();
    migrate(old, NOW, MIGRATIONS.slice(0, 1));
    old.exec(`INSERT INTO workout (startedAt, name, source) VALUES ('a', 'Old history', 'app')`);
    const before = old.exportBytes();
    device.files.set(LIVE_FILE, before);
    old.close();
    device.failImport = () => true;
    await expect(OnDeviceStore.open(device.sqlite, NOW)).rejects.toThrow('disk full');
    expect(device.files.get(LIVE_FILE)).toEqual(before);
    expect(device.closes).toEqual([LIVE_FILE]);
  });

  test('opening a populated v1 database snapshots before applying v2 and v3', async () => {
    const device = new MemoryDevice(await loadSqlite());
    const old = await Database.openInMemory();
    migrate(old, NOW, MIGRATIONS.slice(0, 1));
    old.exec(`
      INSERT INTO workout (startedAt, name, source) VALUES ('a', 'Old history', 'app');
      INSERT INTO appSetting VALUES ('owner-setting', 'keep');
    `);
    const before = old.exportBytes();
    device.files.set(LIVE_FILE, before);
    old.close();
    const store = await OnDeviceStore.open(device.sqlite, NOW);
    expect(store.openReport.appliedMigrations).toEqual(MIGRATIONS.slice(1).map(({ id }) => id));
    const snapshot = device.files.get(store.openReport.snapshotName ?? '');
    expect(snapshot).toEqual(before);
    expect(store.database.value('SELECT name FROM workout')).toBe('Old history');
    expect(store.database.value("SELECT value FROM appSetting WHERE key = 'owner-setting'")).toBe('keep');
    store.database.close();
  });
});
