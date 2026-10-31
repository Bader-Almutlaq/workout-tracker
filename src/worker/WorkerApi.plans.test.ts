import { expect, test, vi } from 'vitest';
import { Database } from '../core/db/Database';
import { loadSqlite } from '../core/db/loadSqlite';
import { migrate } from '../core/db/migrations';
import { TemplateSessionsFixture } from '../core/queries/fixtures/TemplateSessionsFixture';
import { MemoryDevice } from './fixtures/MemoryDevice';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';

test('worker exposes the scoped core report without mutations, snapshots or notifications', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  TemplateSessionsFixture.seed(db);
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', db.exportBytes());
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date('2024-02-01T12:00:00Z'));
  try {
    const api = createWorkerApi(Promise.resolve(store));
    const listener = vi.fn();
    api.subscribe(listener);
    const snapshots = store.snapshotNames();
    expect((await api.templateSessions({ folderId: 1 })).sessions.map((session) => session.id)).toEqual([3, 2, 1]);
    expect((await api.templateSessions({ templateId: 4 })).sessions.map((session) => session.id)).toEqual([5]);
    expect((await api.templateSessions({ folderId: 999 })).sessions).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
    expect(store.snapshotNames()).toEqual(snapshots);
  } finally {
    store.database.close();
  }
});

test('active plan can be set, cleared, and is cleared when deleted', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.run("INSERT INTO templateFolder (id, name, position) VALUES (1, 'Plan', 0)");
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', db.exportBytes());
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date());
  try {
    const api = createWorkerApi(Promise.resolve(store));
    expect(await api.activePlanId()).toBeNull();
    await api.setActivePlan(1);
    expect(await api.activePlanId()).toBe(1);
    await api.setActivePlan(null);
    expect(await api.activePlanId()).toBeNull();
    await expect(api.setActivePlan(999)).rejects.toThrow();
    await api.setActivePlan(1);
    await api.deleteTemplateFolder(1);
    expect(await api.activePlanId()).toBeNull();
  } finally {
    store.database.close();
  }
});
