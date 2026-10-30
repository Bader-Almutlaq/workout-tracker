import { afterEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../core/db/Database';
import { migrate } from '../core/db/migrations';
import { loadSqlite } from '../core/db/loadSqlite';
import { DataSafetyFixture } from '../core/db/fixtures/DataSafetyFixture';
import { log } from '../core/support/log';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';
import { MemoryDevice } from './fixtures/MemoryDevice';

const databases: Database[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const db of databases.splice(0)) db.close();
});

async function setup() {
  const db = await Database.openInMemory();
  migrate(db);
  DataSafetyFixture.seed(db);
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', db.exportBytes());
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date('2026-10-31T12:00:00.000Z'));
  databases.push(store.database);
  const api = createWorkerApi(Promise.resolve(store));
  const listener = vi.fn();
  api.subscribe(listener);
  return { device, store, api, listener };
}

describe('History snapshot boundaries', () => {
  test('entering edit snapshots exactly once; edits notify once each without taking further snapshots', async () => {
    const { store, device, api, listener } = await setup();
    const before = store.database.exportBytes();
    const takeSnapshot = vi.spyOn(store, 'takeSnapshot');
    await api.beginPastWorkoutEdit(1);
    expect(takeSnapshot).toHaveBeenCalledOnce();
    expect(device.files.get(store.snapshotNames()[0] ?? '')).toEqual(before);
    expect(listener).not.toHaveBeenCalled();
    const write = async (operation: () => Promise<void>) => {
      listener.mockClear();
      await operation();
      expect(listener).toHaveBeenCalledOnce();
    };
    await write(() => api.updatePastWorkout(1, { field: 'name', value: 'Corrected' }));
    await write(() => api.updatePastWorkout(1, { field: 'notes', value: 'Notes' }));
    await write(() => api.updatePastWorkout(1, { field: 'startedAt', value: '2026-10-25T12:00:00.000Z' }));
    await write(() => api.updatePastWorkout(1, { field: 'durationSeconds', value: 1800 }));
    await write(() => api.updateWorkoutExerciseNotes(1, 'Entry correction'));
    await write(() => api.updateWorkoutSetNotes(1, 'Set correction'));
    await write(() => api.updateSet(1, 65, 'kg', 8, 8, 'working', 75));
    await write(() => api.addSet(1));
    await write(() => api.deleteSet(3));
    await write(() => api.addExercises(1, [2]));
    const entryId = (await api.pastWorkout(1))?.entries[1]?.entry.id;
    if (entryId === undefined) throw new Error('Missing added entry');
    await write(() => api.moveExercise(entryId, 0));
    await write(() => api.removeExercise(entryId));
    expect(takeSnapshot).toHaveBeenCalledOnce();
    expect(await api.activeWorkoutId()).toBe(2);
  });

  test('deletion takes a new snapshot of the latest edits, then deletes and notifies once', async () => {
    const { store, device, api, listener } = await setup();
    await api.beginPastWorkoutEdit(1);
    await api.updatePastWorkout(1, { field: 'name', value: 'Latest edit' });
    const beforeDelete = store.database.exportBytes();
    listener.mockClear();
    await api.deletePastWorkout(1);
    expect(store.snapshotNames()).toHaveLength(2);
    expect(device.files.get(store.snapshotNames()[0] ?? '')).toEqual(beforeDelete);
    expect(await api.pastWorkout(1)).toBeUndefined();
    expect(await api.activeWorkoutId()).toBe(2);
    expect(listener).toHaveBeenCalledOnce();
  });

  test.each(['enter', 'delete'] as const)(
    'failed snapshot blocks %s with readable error, no database change and no notification',
    async (action) => {
      const { store, device, api, listener } = await setup();
      const logged = vi.spyOn(log.database, 'error').mockImplementation(() => undefined);
      const before = DataSafetyFixture.read(store.database);
      device.failImport = (name) => name.startsWith('/snapshot-');
      const operation = action === 'enter' ? api.beginPastWorkoutEdit(1) : api.deletePastWorkout(1);
      await expect(operation).rejects.toMatchObject({
        kind: 'snapshotFailed',
        message: expect.stringContaining('safety copy'),
      });
      expect(DataSafetyFixture.read(store.database)).toEqual(before);
      expect(listener).not.toHaveBeenCalled();
      expect(logged).toHaveBeenCalledOnce();
      device.failImport = undefined;
      await expect(api.beginPastWorkoutEdit(1)).resolves.toBeUndefined();
    },
  );

  test('live and missing workouts never enter edit or delete and are absent from History reads', async () => {
    const { store, api, listener } = await setup();
    const snapshot = vi.spyOn(store, 'takeSnapshot');
    for (const id of [2, -1]) {
      expect(await api.pastWorkout(id)).toBeUndefined();
      await expect(api.beginPastWorkoutEdit(id)).rejects.toBeInstanceOf(Error);
      await expect(api.deletePastWorkout(id)).rejects.toBeInstanceOf(Error);
    }
    expect(snapshot).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  test('writes cannot overtake an edit-entry snapshot waiting for disk I/O', async () => {
    const { device, store, api } = await setup();
    let release: (() => void) | undefined;
    let entered: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const reached = new Promise<void>((resolve) => {
      entered = resolve;
    });
    device.beforeImport = async (name) => {
      if (name.startsWith('/snapshot-')) {
        entered?.();
        await gate;
      }
    };
    const entering = api.beginPastWorkoutEdit(1);
    await reached;
    const writing = api.updatePastWorkout(1, { field: 'name', value: 'After snapshot' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.database.value('SELECT name FROM workout WHERE id = 1')).toBe('History α');
    release?.();
    await Promise.all([entering, writing]);
    const bytes = device.files.get(store.snapshotNames()[0] ?? '');
    if (bytes === undefined) throw new Error('Missing snapshot');
    const copy = await Database.fromBytes(bytes);
    databases.push(copy);
    expect(copy.value('SELECT name FROM workout WHERE id = 1')).toBe('History α');
    expect(store.database.value('SELECT name FROM workout WHERE id = 1')).toBe('After snapshot');
  });
});
