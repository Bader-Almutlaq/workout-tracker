import { afterEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../core/db/Database';
import { DataSafetyFixture } from '../core/db/fixtures/DataSafetyFixture';
import { loadSqlite } from '../core/db/loadSqlite';
import { migrate } from '../core/db/migrations';
import { log } from '../core/support/log';
import { OLDER_LAYOUT } from '../core/import/fixtures/StrongFixtures';
import { makeImportOptions } from '../core/import/StrongImportOptions';
import type { TemplateDraft } from '../core/templates/TemplateDraft';
import { OnDeviceStore } from './OnDeviceStore';
import { createWorkerApi } from './WorkerApi';
import { MemoryDevice } from './fixtures/MemoryDevice';

const NOW = new Date('2026-10-30T12:00:00.000Z');
const draft = { name: 'Synthetic custom', primaryMuscles: ['chest'] } as const;

afterEach(() => vi.restoreAllMocks());

async function setup(populated = true) {
  const device = new MemoryDevice(await loadSqlite());
  if (populated) {
    const db = await Database.openInMemory();
    migrate(db);
    DataSafetyFixture.seed(db);
    device.files.set('/workouts.sqlite', db.exportBytes());
    db.close();
  }
  const store = await OnDeviceStore.open(device.sqlite, NOW);
  return { device, store, api: createWorkerApi(Promise.resolve(store)) };
}

describe('worker safety regressions', () => {
  test('starting a workout with a missing exercise rolls back the entire request', async () => {
    const { store, api } = await setup(false);
    const exercise = await api.createExercise(draft);
    const before = DataSafetyFixture.read(store.database);
    const listener = vi.fn();
    api.subscribe(listener);
    await expect(api.startWorkout('Failed start', [exercise, -1])).rejects.toMatchObject({ kind: 'exerciseNotFound' });
    expect(DataSafetyFixture.read(store.database)).toEqual(before);
    expect(listener).not.toHaveBeenCalled();
    store.database.close();
  });

  test('adding a batch with a missing exercise rolls back the entire request', async () => {
    const { store, api } = await setup();
    const before = DataSafetyFixture.read(store.database);
    await expect(api.addExercises(2, [1, -1])).rejects.toMatchObject({ kind: 'exerciseNotFound' });
    expect(DataSafetyFixture.read(store.database)).toEqual(before);
    store.database.close();
  });

  test('a write submitted during restore waits and applies to the restored connection', async () => {
    const { store, api, device } = await setup();
    const backup = store.database.exportBytes();
    let enterSnapshot: (() => void) | undefined;
    const entered = new Promise<void>((resolve) => {
      enterSnapshot = resolve;
    });
    let releaseSnapshot: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseSnapshot = resolve;
    });
    device.beforeImport = async (name) => {
      if (name.startsWith('/snapshot-')) {
        enterSnapshot?.();
        await gate;
      }
    };
    const restoring = api.restoreBackup(backup);
    await entered;
    let written = false;
    const writing = api.updateWorkout(2, 'Edit after restore', 'Preserve this tap').then(() => {
      written = true;
    });
    // Drain unblocked promise continuations for one event-loop turn, leaving simulated disk I/O paused.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const wroteBeforeRestoreCompleted = written;
    releaseSnapshot?.();
    await Promise.all([restoring, writing]);
    expect(wroteBeforeRestoreCompleted).toBe(false);
    expect(store.database.value('SELECT name FROM workout WHERE id = 2')).toBe('Edit after restore');
    store.database.close();
  });

  test('restore cannot overtake an import waiting for its safety snapshot', async () => {
    const { store, api, device } = await setup();
    const backup = store.database.exportBytes();
    await api.planStrongImport([{ name: 'synthetic.csv', text: OLDER_LAYOUT }]);
    let enterSnapshot: (() => void) | undefined;
    const entered = new Promise<void>((resolve) => {
      enterSnapshot = resolve;
    });
    let releaseSnapshot: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseSnapshot = resolve;
    });
    let firstSnapshot = true;
    device.beforeImport = async (name) => {
      if (firstSnapshot && name.startsWith('/snapshot-')) {
        firstSnapshot = false;
        enterSnapshot?.();
        await gate;
      }
    };
    const importing = api.runStrongImport(makeImportOptions());
    await entered;
    let restored = false;
    const restoring = api.restoreBackup(backup).then(() => {
      restored = true;
    });
    // All other harness I/O resolves immediately; one event-loop turn drains it while the import stays paused.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const restoreOvertookImport = restored;
    releaseSnapshot?.();
    await Promise.all([importing, restoring]);
    expect(restoreOvertookImport).toBe(false);
    expect(store.database.value('SELECT count(*) FROM workout')).toBe(2);
    store.database.close();
  });

  test('a broken subscriber cannot turn a committed write into a failure or prevent other notifications', async () => {
    const { store, api } = await setup();
    const errors = vi.spyOn(log.ui, 'error').mockImplementation(() => undefined);
    api.subscribe(() => {
      throw new Error('Disconnected screen');
    });
    api.subscribe(async () => {
      throw new Error('Disconnected remote screen');
    });
    const healthy = vi.fn();
    api.subscribe(healthy);
    await expect(api.updateWorkout(2, 'Committed', null)).resolves.toBeUndefined();
    await Promise.resolve();
    expect(healthy).toHaveBeenCalledOnce();
    expect(errors).toHaveBeenCalledTimes(2);
    expect(store.database.value('SELECT name FROM workout WHERE id = 2')).toBe('Committed');
    store.database.close();
  });
});

test('every database mutation notifies once; errors reject, notify nothing, and do not poison later requests', async () => {
  const { store, api } = await setup(false);
  const listener = vi.fn();
  api.subscribe(listener);
  const write = async <Result>(operation: () => Promise<Result>): Promise<Result> => {
    listener.mockClear();
    const result = await operation();
    expect(listener).toHaveBeenCalledOnce();
    return result;
  };
  const exercise = await write(() => api.createExercise(draft));
  await write(() => api.updateExercise(exercise, { ...draft, name: 'Renamed custom' }));
  await write(() => api.setExerciseArchived(exercise, true));
  await write(() => api.setExerciseArchived(exercise, false));
  await write(() => api.setRestTarget(exercise, 150));
  await write(() => api.recordBackupMade());
  const folder = await write(() => api.createTemplateFolder('Folder'));
  await write(() => api.renameTemplateFolder(folder, 'Renamed folder'));
  await write(() => api.reorderTemplateFolder(folder, 0));
  const templateDraft: TemplateDraft = {
    name: 'Plan',
    folderId: folder,
    notes: 'Template notes',
    exercises: [
      {
        exerciseId: exercise,
        notes: 'Entry',
        supersetGroup: 1,
        sets: [{ kind: 'working', targetRepsLow: 5, targetRepsHigh: 8, targetRpe: 8 }],
      },
    ],
  };
  const template = await write(() => api.saveTemplate(templateDraft));
  await write(() => api.renameTemplate(template, 'Renamed plan'));
  const duplicate = await write(() => api.duplicateTemplate(template));
  await write(() => api.moveTemplate(duplicate, null));
  await write(() => api.reorderTemplate(duplicate, 0));
  await write(() => api.deleteTemplate(duplicate));
  const workout = await write(() => api.startFromTemplate(template));
  await write(() => api.updateWorkout(workout, 'Workout notes', 'Keep'));
  await write(() => api.addExercises(workout, [exercise]));
  const entry =
    store.database.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position', [workout]) ??
    -1;
  const extra =
    store.database.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position DESC', [
      workout,
    ]) ?? -1;
  await write(() => api.moveExercise(extra, 0));
  await write(() => api.removeExercise(extra));
  await write(() => api.addSet(entry));
  const set =
    store.database.value<number>('SELECT id FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position', [entry]) ??
    -1;
  const spare =
    store.database.value<number>('SELECT id FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position DESC', [
      entry,
    ]) ?? -1;
  await write(() => api.updateSet(set, 62.123, 'lb', 8, 8.5, 'failure', 65));
  await write(() => api.setEntryUnit('lb', entry));
  await write(() => api.setCompleted(set, true));
  await write(() => api.deleteSet(spare));
  await write(() => api.finishWorkout(workout));
  const saved = await write(() => api.createTemplateFromWorkout(workout, 'Saved workout', null));
  await write(() => api.deleteTemplate(saved));
  const active = await write(() => api.startWorkout('New', [exercise]));
  await write(() => api.discardWorkout(active));
  await write(() => api.deleteTemplateFolder(folder));
  const source = await write(() => api.createExercise({ ...draft, name: 'Merge source' }));
  await write(() => api.mergeExercise(source, exercise));
  const anotherSource = await write(() => api.createExercise({ ...draft, name: 'Batch source' }));
  await write(() => api.mergeExercises([[anotherSource, exercise]]));
  await api.planStrongImport([{ name: 'synthetic.csv', text: OLDER_LAYOUT }]);
  await write(() => api.runStrongImport(makeImportOptions()));
  const backup = await api.exportBackup();
  await write(() => api.restoreBackup(backup.bytes));
  listener.mockClear();
  await expect(api.updateSet(-1, 10, 'kg', 5, null, 'working', null)).rejects.toMatchObject({ kind: 'setNotFound' });
  expect(listener).not.toHaveBeenCalled();
  await write(() => api.updateWorkout(workout, 'Still works', null));
  store.database.close();
});

test('snapshot failure aborts both import and merge before changing any records or notifying screens', async () => {
  const { store, api, device } = await setup();
  const before = DataSafetyFixture.read(store.database);
  await api.planStrongImport([{ name: 'synthetic.csv', text: OLDER_LAYOUT }]);
  const listener = vi.fn();
  api.subscribe(listener);
  device.failImport = (name) => name.startsWith('/snapshot-');
  await expect(api.runStrongImport(makeImportOptions())).rejects.toThrow('disk full');
  expect(DataSafetyFixture.read(store.database)).toEqual(before);
  await expect(api.mergeExercise(1, 2)).rejects.toThrow('disk full');
  expect(DataSafetyFixture.read(store.database)).toEqual(before);
  expect(listener).not.toHaveBeenCalled();
  store.database.close();
});

test('successful import and merge each snapshot the exact database before any mutation', async () => {
  const { store, api, device } = await setup();
  const checkSnapshot = async (operation: () => Promise<unknown>) => {
    const before = DataSafetyFixture.read(store.database);
    await operation();
    const bytes = device.files.get(store.snapshotNames()[0] ?? '');
    const saved = await Database.fromBytes(bytes ?? new Uint8Array());
    expect(DataSafetyFixture.read(saved)).toEqual(before);
    saved.close();
  };
  await checkSnapshot(() => api.mergeExercise(1, 2));
  await api.planStrongImport([{ name: 'synthetic.csv', text: OLDER_LAYOUT }]);
  await checkSnapshot(() => api.runStrongImport(makeImportOptions()));
  store.database.close();
});

test('warm-up edit protection and deletion suppression survive separate worker API calls', async () => {
  const { store, api } = await setup(false);
  try {
    const exerciseId = await api.createExercise({
      ...draft,
      equipment: 'barbell',
      mechanic: 'compound',
      pattern: 'horizontal-push',
    });
    const workoutId = await api.startWorkout('Warm-up test', [exerciseId]);
    const entry = (await api.liveWorkout())?.entries[0];
    const work = entry?.sets[0];
    if (entry === undefined || work === undefined) throw new Error('Missing workout');
    await api.updateSet(work.id, 100, 'kg', 8, null, 'working', null);
    const suggestions = await api.suggestedWarmupSetIds(entry.entry.id);
    expect(suggestions).toHaveLength(3);
    const first = suggestions[0];
    if (first === undefined) throw new Error('Missing suggestion');
    await api.updateSet(first, 42.5, 'kg', 10, null, 'warmup', null);
    await api.updateSet(work.id, 120, 'kg', 8, null, 'working', null);
    expect((await api.workoutDetail(workoutId))?.entries[0]?.sets[0]).toMatchObject({
      weightKilograms: 42.5,
      reps: 10,
    });
    expect(await api.suggestedWarmupSetIds(entry.entry.id)).not.toContain(first);
    for (const set of (await api.liveWorkout())?.entries[0]?.sets ?? []) {
      if (set.kind === 'warmup') await api.deleteSet(set.id);
    }
    await api.updateSet(work.id, 130, 'kg', 8, null, 'working', null);
    expect((await api.liveWorkout())?.entries[0]?.sets).toHaveLength(1);
    await api.updateExerciseLoading(exerciseId, { warmupSetCount: 0 });
    expect((await api.exerciseDetail(exerciseId))?.exercise.warmupSetCount).toBe(0);
  } finally {
    store.database.close();
  }
});
