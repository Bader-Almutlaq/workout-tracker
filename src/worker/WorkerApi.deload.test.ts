import { expect, test, vi } from 'vitest';
import { Database } from '../core/db/Database';
import { migrate, MIGRATIONS } from '../core/db/migrations';
import { loadSqlite } from '../core/db/loadSqlite';
import { validateBackup } from '../core/backup/BackupValidation';
import { MemoryDevice } from './fixtures/MemoryDevice';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';

async function setup() {
  const db = await Database.openInMemory();
  migrate(db, new Date('2026-01-01'), MIGRATIONS.slice(0, 8));
  db.exec(`
    INSERT INTO exercise (id, name, equipment, movementPattern, mechanic, source, createdAt)
    VALUES (1, 'Synthetic squat', 'barbell', 'squat', 'compound', 'custom', '2026-01-01'),
      (2, 'Synthetic curl', 'dumbbell', 'curl', 'isolation', 'custom', '2026-01-01');
    INSERT INTO workout (id, name, startedAt, source) VALUES (1, 'Normal', '2026-01-01T12:00:00Z', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe)
    VALUES (1, 0, 'working', 100, 'kg', 8, 8);
  `);
  const original = db.exportBytes();
  const device = new MemoryDevice(await loadSqlite());
  device.files.set('/workouts.sqlite', original);
  db.close();
  const store = await OnDeviceStore.open(device.sqlite, new Date('2026-02-01'));
  return { store, device, original, api: createWorkerApi(Promise.resolve(store)) };
}

test('worker sets, clears and deloads every entry with one notification each; no set values are written', async () => {
  const { store, api } = await setup();
  try {
    const id = await api.startWorkout('Deload', [1, 2]);
    const initial = await api.liveWorkout();
    const first = initial?.entries[0];
    if (first === undefined) throw new Error('Missing synthetic exercise');
    const listener = vi.fn();
    api.subscribe(listener);
    await api.setDeloadStage(first.entry.id, 1);
    expect((await api.liveWorkout())?.entries[0]?.deload?.suggestions[0]?.weightKilograms).toBe(80);
    await api.setDeloadStage(first.entry.id, null);
    expect((await api.liveWorkout())?.entries[0]?.entry.deloadStage).toBeNull();
    await api.deloadWorkout(id);
    expect(listener).toHaveBeenCalledTimes(3);
    const result = await api.liveWorkout();
    expect(result?.entries.map((entry) => entry.entry.deloadStage)).toEqual([1, 1]);
    expect(result?.entries.map((entry) => entry.sets)).toEqual(initial?.entries.map((entry) => entry.sets));
    await expect(api.setDeloadStage(-1, 1)).rejects.toMatchObject({ kind: 'exerciseNotFound' });
    expect(listener).toHaveBeenCalledTimes(3);
  } finally {
    store.database.close();
  }
});

test('worker auto-advances after finish, survives history edits and backup, and reports chart dates without excluding PRs', async () => {
  const { store, api } = await setup();
  try {
    const id = await api.startWorkout('Deload', [1]);
    const first = (await api.liveWorkout())?.entries[0];
    const set = first?.sets[0];
    if (first === undefined || set === undefined) throw new Error('Missing synthetic exercise');
    await api.setDeloadStage(first.entry.id, 1);
    await api.updateSet(set.id, 110, 'kg', 8, 8, 'working', null);
    await api.setCompleted(set.id, true);
    await api.finishWorkout(id);
    await api.beginPastWorkoutEdit(id);
    await api.updateWorkoutExerciseNotes(first.entry.id, 'History edit');
    expect((await api.pastWorkout(id))?.entries[0]?.entry.deloadStage).toBe(1);
    const charts = await api.exerciseCharts(1);
    expect(charts.deloadDates).toHaveLength(1);
    expect(charts.estimatedOneRepMax).toHaveLength(2);
    expect(charts.progression.at(-1)?.set.weightKilograms).toBe(110);
    const next = await api.startWorkout('Build back', [1]);
    const second = (await api.liveWorkout())?.entries[0];
    expect(second?.entry.deloadStage).toBe(2);
    expect(second?.deload?.suggestions[0]?.weightKilograms).toBe(90);
    const backup = await api.exportBackup();
    await expect(validateBackup(backup.bytes)).resolves.toBeUndefined();
    await api.restoreBackup(backup.bytes);
    expect((await api.liveWorkout())?.entries[0]?.entry.deloadStage).toBe(2);
    const secondSet = second?.sets[0];
    if (secondSet === undefined) throw new Error('Missing second set');
    await api.setCompleted(secondSet.id, true);
    await api.finishWorkout(next);
    await api.startWorkout('Normal again', [1]);
    expect((await api.liveWorkout())?.entries[0]?.entry.deloadStage).toBeNull();
  } finally {
    store.database.close();
  }
});

test('opening v8 snapshots the original bytes before appending the stage column', async () => {
  const { store, device, original } = await setup();
  try {
    const snapshot = [...device.files.entries()].find(([name]) => name.startsWith('/snapshot-'));
    expect(snapshot?.[1]).toEqual(original);
    expect(store.database.all('SELECT deloadStage FROM workoutExercise')).toEqual([{ deloadStage: null }]);
  } finally {
    store.database.close();
  }
});
