import { afterEach, describe, expect, test } from 'vitest';
import { Database } from '../core/db/Database';
import { migrate } from '../core/db/migrations';
import { loadSqlite } from '../core/db/loadSqlite';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';
import { MemoryDevice } from './fixtures/MemoryDevice';

const opened: OnDeviceStore[] = [];
const NOW = '2026-10-31T12:00:00.000Z';

async function setup() {
  const db = await Database.openInMemory();
  migrate(db);
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', db.exportBytes());
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date(NOW));
  opened.push(store);
  return { store, api: createWorkerApi(Promise.resolve(store)) };
}

afterEach(() => {
  for (const store of opened.splice(0)) store.database.close();
});

describe('Dropbox worker metadata', () => {
  test('defaults to disconnected; records cloud and manual backup dates atomically, and disconnect keeps the manual date', async () => {
    const { store, api } = await setup();
    expect(await api.cloudBackupSettings()).toEqual({ provider: null, pending: false, lastCloudBackupAt: undefined });
    await api.updateCloudBackupSettings({ provider: 'dropbox', pending: true });
    await api.updateCloudBackupSettings({ lastCloudBackupAt: NOW, pending: false });
    expect(await api.lastBackupAt()).toBe(NOW);
    expect(await api.cloudBackupSettings()).toEqual({ provider: 'dropbox', pending: false, lastCloudBackupAt: NOW });
    expect(
      store.database.all(`SELECT key FROM appSetting WHERE key LIKE 'cloud%' OR key LIKE 'lastCloud%'`),
    ).toHaveLength(3);
    await api.updateCloudBackupSettings({ provider: null, lastCloudBackupAt: null, pending: false });
    expect(await api.cloudBackupSettings()).toEqual({ provider: null, pending: false, lastCloudBackupAt: undefined });
    expect(await api.lastBackupAt()).toBe(NOW);
  });

  test('persists a retry flag with a saved workout, and not with a discarded empty workout', async () => {
    const { api } = await setup();
    const exercise = await api.createExercise({ name: 'Synthetic lift', primaryMuscles: ['chest'] });
    await api.updateCloudBackupSettings({ provider: 'dropbox', pending: false });
    const id = await api.startWorkout('Synthetic workout', [exercise]);
    const detail = await api.workoutDetail(id);
    const entryId = detail?.entries[0]?.entry.id;
    if (entryId === undefined) throw new Error('Missing synthetic workout entry');
    await api.addSet(entryId);
    const populated = await api.workoutDetail(id);
    const setId = populated?.entries[0]?.sets[0]?.id;
    if (setId === undefined) throw new Error('Missing synthetic set');
    await api.setCompleted(setId, true);
    expect((await api.finishWorkout(id)).workoutId).toBe(id);
    expect((await api.cloudBackupSettings()).pending).toBe(true);
    await api.updateCloudBackupSettings({ pending: false });
    const empty = await api.startWorkout('Empty', []);
    expect((await api.finishWorkout(empty)).workoutId).toBeNull();
    expect((await api.cloudBackupSettings()).pending).toBe(false);
  });

  test('a disconnected finish does not schedule cloud work', async () => {
    const { store, api } = await setup();
    const exercise = await api.createExercise({ name: 'Synthetic lift', primaryMuscles: ['chest'] });
    const id = await api.startWorkout('No Dropbox', [exercise]);
    const entryId = store.database.value<number>(`SELECT id FROM workoutExercise WHERE workoutId = ?`, [id]);
    if (entryId === undefined) throw new Error('Missing synthetic entry');
    await api.addSet(entryId);
    const setId = store.database.value<number>(`SELECT id FROM workoutSet WHERE workoutExerciseId = ?`, [entryId]);
    if (setId === undefined) throw new Error('Missing synthetic set');
    await api.setCompleted(setId, true);
    await api.finishWorkout(id);
    expect((await api.cloudBackupSettings()).pending).toBe(false);
  });

  test('an edit during upload cannot clear the retry flag for data absent from the exported file', async () => {
    const { api } = await setup();
    await api.updateCloudBackupSettings({ provider: 'dropbox', pending: true });
    const exported = await api.exportBackup();
    await api.createExercise({ name: 'Arrived during upload', primaryMuscles: ['chest'] });
    await api.updateCloudBackupSettings({
      lastCloudBackupAt: NOW,
      pending: false,
      completedExportVersion: exported.changeVersion,
    });
    expect(await api.cloudBackupSettings()).toMatchObject({ pending: true, lastCloudBackupAt: NOW });
    const retried = await api.exportBackup();
    await api.updateCloudBackupSettings({
      lastCloudBackupAt: NOW,
      pending: false,
      completedExportVersion: retried.changeVersion,
    });
    expect((await api.cloudBackupSettings()).pending).toBe(false);
  });

  test('metadata survives a database export/reopen and contains no authentication credentials', async () => {
    const { api } = await setup();
    await api.updateCloudBackupSettings({ provider: 'dropbox', pending: true, lastCloudBackupAt: NOW });
    const { bytes } = await api.exportBackup();
    const saved = await Database.fromBytes(bytes);
    try {
      expect(saved.all(`SELECT key, value FROM appSetting WHERE key LIKE 'cloud%' ORDER BY key`)).toEqual([
        { key: 'cloudBackupPending', value: 'true' },
        { key: 'cloudBackupProvider', value: 'dropbox' },
      ]);
      expect(saved.value<string>(`SELECT value FROM appSetting WHERE key = 'lastCloudBackupAt'`)).toBe(NOW);
    } finally {
      saved.close();
    }
  });
});
