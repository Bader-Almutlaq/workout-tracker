import { describe, expect, test } from 'vitest';
import { loadSqlite } from '../core/db/loadSqlite';
import { WorkoutFileFixtures } from '../core/import/formats/fixtures/WorkoutFileFixtures';
import { makeImportOptions } from '../core/import/StrongImportOptions';
import { WAIST } from '../core/import/fixtures/StrongFixtures';
import { createWorkerApi } from './WorkerApi';
import { OnDeviceStore } from './OnDeviceStore';
import { MemoryDevice } from './fixtures/MemoryDevice';

const Now = new Date('2026-10-31T12:00:00.000Z');

async function setup() {
  const device = new MemoryDevice(await loadSqlite());
  const store = await OnDeviceStore.open(device.sqlite, Now);
  return { device, store, api: createWorkerApi(Promise.resolve(store)) };
}

describe('worker workout format dispatch', () => {
  test.each(['hevy', 'fitnotes', 'fitbod'] as const)(
    '%s is detected from its header, reviewed and snapshotted',
    async (format) => {
      const { store, api, device } = await setup();
      try {
        const plan = await api.planStrongImport(
          [{ name: 'misleading-strong.csv', text: WorkoutFileFixtures[format] }],
          format,
        );
        expect(plan.sourceFormat).toBe(format);
        expect(store.database.value('SELECT count(*) FROM workout')).toBe(0);
        const reviewed = await api.reviewStrongImport(makeImportOptions({ excludedLines: new Set([2]) }));
        expect(reviewed.setsExcluded).toBe(1);
        device.failImport = (name) => name.startsWith('/snapshot-');
        await expect(api.runStrongImport(makeImportOptions())).rejects.toThrow('disk full');
        expect(store.database.value('SELECT count(*) FROM workout')).toBe(0);
        device.failImport = undefined;
        expect((await api.runStrongImport(makeImportOptions())).setsAdded).toBe(plan.totals.sets);
        expect((await api.runStrongImport(makeImportOptions())).setsAdded).toBe(0);
      } finally {
        store.database.close();
      }
    },
  );

  test('Strong measurement files are refused for another app', async () => {
    const { store, api } = await setup();
    try {
      await expect(api.planStrongImport([{ name: 'waist.csv', text: WAIST }], 'hevy')).rejects.toThrow(
        'Measurement files can only be imported from Strong.',
      );
    } finally {
      store.database.close();
    }
  });

  test('reports the expected and detected formats for a wrong app', async () => {
    const { store, api } = await setup();
    try {
      await expect(
        api.planStrongImport([{ name: 'workouts.csv', text: WorkoutFileFixtures.hevy }], 'strong'),
      ).rejects.toMatchObject({
        kind: 'wrongWorkoutFile',
        details: { expected: 'strong', detected: 'hevy' },
        message: 'This looks like a Hevy export, not a Strong export.',
      });
    } finally {
      store.database.close();
    }
  });

  test('unknown headers fail with the specified message and clear any stale plan', async () => {
    const { store, api } = await setup();
    try {
      await api.planStrongImport([{ name: 'hevy.csv', text: WorkoutFileFixtures.hevy }], 'hevy');
      await expect(
        api.planStrongImport([{ name: 'hevy.csv', text: 'Date,Exercise,Reps\n2024-01-01,Curl,8' }]),
      ).rejects.toThrow("This file isn't a Strong, Hevy, FitNotes or Fitbod workout export.");
      await expect(api.runStrongImport(makeImportOptions())).rejects.toThrow('Choose files');
    } finally {
      store.database.close();
    }
  });

  test('only one workouts file is allowed and damaged supported headers name missing columns', async () => {
    const { store, api } = await setup();
    try {
      await expect(
        api.planStrongImport(
          [
            { name: 'a.csv', text: WorkoutFileFixtures.hevy },
            { name: 'b.csv', text: WorkoutFileFixtures.fitbod },
          ],
          'hevy',
        ),
      ).rejects.toThrow('only one workouts file');
      await expect(
        api.planStrongImport([{ name: 'damaged.csv', text: 'title,exercise_title' }], 'hevy'),
      ).rejects.toThrow('start_time');
    } finally {
      store.database.close();
    }
  });
});
