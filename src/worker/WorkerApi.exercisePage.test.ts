import { expect, test } from 'vitest';
import { Database } from '../core/db/Database';
import { migrate } from '../core/db/migrations';
import { loadSqlite } from '../core/db/loadSqlite';
import { MemoryDevice } from './fixtures/MemoryDevice';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';

test('exercise page worker methods return only the selected exercise and leave data unchanged', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, equipment, movementPattern, mechanic, source, createdAt)
    VALUES (1, 'Synthetic press', 'barbell', 'horizontal-push', 'compound', 'custom', '2026-01-01');
    INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01', 'Synthetic session', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, rpe, entryUnit)
    VALUES (1, 0, 'working', 87, 5, 10, 'kg'), (1, 1, 'warmup', 290, 12, 10, 'kg');
  `);
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', db.exportBytes());
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date('2026-02-01'));
  try {
    const api = createWorkerApi(Promise.resolve(store));
    const before = store.database.exportBytes();
    const history = await api.exerciseHistory(1);
    expect(history[0]?.name).toBe('Synthetic session');
    expect(history[0]?.sets).toHaveLength(2);
    expect(await api.exerciseHistory(1, 200)).toEqual([]);
    const charts = await api.exerciseCharts(1);
    expect(charts.estimatedOneRepMax[0]?.value).toBe(99);
    expect(charts.sessionVolume[0]?.value).toBe(435);
    expect(charts.progression[0]?.value).toBe(99);
    expect(charts.duration).toEqual([]);
    const records = await api.exerciseRecords(1);
    expect(records.heaviestWeight?.value).toBe(87);
    expect(records.repMax[4]?.predictedKilograms).toBeCloseTo(87);
    expect(await api.exerciseHistory(999)).toEqual([]);
    expect((await api.exerciseCharts(999)).bestReps).toEqual([]);
    expect((await api.exerciseRecords(999)).repMax).toEqual([]);
    expect(store.database.exportBytes()).toEqual(before);
  } finally {
    store.database.close();
  }
});

test('worker saves machine names and filters chart occurrences', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Press', 'custom', '2026-01-01');
    INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01', 'Session', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, entryUnit)
      VALUES (1, 0, 'working', 50, 8, 'kg');
  `);
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', db.exportBytes());
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date('2026-02-01'));
  try {
    const api = createWorkerApi(Promise.resolve(store));
    await api.setMachineBrand(1, ' panatta ');
    expect(await api.usedMachineBrands()).toEqual(['Panatta']);
    expect((await api.exerciseCharts(1, 'Panatta')).machineBrands).toEqual(['Panatta']);
    expect((await api.exerciseCharts(1, null)).heaviestWeight).toEqual([]);
    await api.setMachineBrand(1, null);
    expect(await api.usedMachineBrands()).toEqual([]);
  } finally {
    store.database.close();
  }
});
