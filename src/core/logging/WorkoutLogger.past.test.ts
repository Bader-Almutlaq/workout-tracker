import { afterEach, describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { DataSafetyFixture } from '../db/fixtures/DataSafetyFixture';
import { makeImportOptions } from '../import/StrongImportOptions';
import { makeStrongImportPlan } from '../import/StrongImportPlan';
import { parseStrongWorkoutsFile } from '../import/StrongWorkoutsFile';
import { importStrongPlan, strongImportWorkoutCounts } from '../import/StrongImporter';
import { OLDER_LAYOUT } from '../import/fixtures/StrongFixtures';
import { workoutDetail } from '../queries/WorkoutHistory';
import { WorkoutLogger } from './WorkoutLogger';

const databases: Database[] = [];
const NOW = new Date('2026-10-31T10:00:00.000Z');

afterEach(() => {
  for (const db of databases.splice(0)) db.close();
});

async function setup() {
  const db = await Database.openInMemory();
  databases.push(db);
  migrate(db);
  DataSafetyFixture.seed(db);
  return { db, logger: new WorkoutLogger(db) };
}

describe('finished workout edits', () => {
  test('set edits and all three note levels persist without changing import identity or unrelated fields', async () => {
    const { db, logger } = await setup();
    const before = workoutDetail(db, 1);
    logger.updateFinished(1, { field: 'name', value: 'Corrected' });
    logger.updateFinished(1, { field: 'notes', value: 'Workout correction' });
    logger.updateExerciseNotes(1, 'Exercise correction');
    logger.updateSetNotes(1, 'Set correction');
    logger.updateSet(1, 63.503, 'lb', 8, 9, 'drop', 75);
    const after = workoutDetail(db, 1);
    expect(after?.workout).toEqual({ ...before?.workout, name: 'Corrected', notes: 'Workout correction' });
    expect(after?.entries[0]?.entry).toEqual({ ...before?.entries[0]?.entry, notes: 'Exercise correction' });
    expect(after?.entries[0]?.sets[0]).toEqual({
      ...before?.entries[0]?.sets[0],
      weightKilograms: 63.503,
      entryUnit: 'lb',
      reps: 8,
      rpe: 9,
      kind: 'drop',
      durationSeconds: 75,
      notes: 'Set correction',
    });
    logger.updateExerciseNotes(1, '');
    logger.updateSetNotes(1, '');
    expect(workoutDetail(db, 1)?.entries[0]?.entry.notes).toBeNull();
    expect(workoutDetail(db, 1)?.entries[0]?.sets[0]?.notes).toBeNull();
    expect(logger.activeWorkoutId()).toBe(2);
  });

  test('start changes preserve exact duration; unknown end times stay unknown until a duration is entered', async () => {
    const { db, logger } = await setup();
    logger.updateFinished(1, { field: 'startedAt', value: '2025-12-31T23:45:00.000Z' });
    expect(workoutDetail(db, 1)?.workout.endedAt).toBe('2026-01-01T00:45:00.333Z');
    logger.updateFinished(1, { field: 'durationSeconds', value: 90.5 });
    expect(workoutDetail(db, 1)?.workout.endedAt).toBe('2025-12-31T23:46:30.500Z');
    logger.updateFinished(1, { field: 'durationSeconds', value: null });
    logger.updateFinished(1, { field: 'startedAt', value: '2026-01-02T00:00:00.000Z' });
    expect(workoutDetail(db, 1)?.workout.endedAt).toBeNull();
    logger.updateFinished(1, { field: 'durationSeconds', value: 0 });
    expect(workoutDetail(db, 1)?.workout.endedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  test('invalid times, missing ids and live workout ids refuse finished-only operations without writes', async () => {
    const { db, logger } = await setup();
    const before = DataSafetyFixture.read(db);
    expect(() => logger.updateFinished(1, { field: 'startedAt', value: '' })).toThrow('valid start time');
    for (const value of [-1, NaN, Infinity, 1e308]) {
      expect(() => logger.updateFinished(1, { field: 'durationSeconds', value })).toThrow('valid start time');
    }
    expect(() => logger.requireFinished(-1)).toThrow('no longer exists');
    expect(() => logger.updateFinished(2, { field: 'name', value: 'Forbidden' })).toThrow('Workout tab');
    expect(() => logger.deleteFinished(2)).toThrow('Workout tab');
    expect(DataSafetyFixture.read(db)).toEqual(before);
  });

  test('finished additions are completed, with no fabricated completion timestamps or generated warm-ups; reorder persists', async () => {
    const { db, logger } = await setup();
    const addedSet = logger.addSet(1);
    const entry = logger.addExercise(2, 1);
    logger.moveExercise(entry, 0);
    expect(workoutDetail(db, 1)?.entries.map((item) => item.entry.id)).toEqual([entry, 1]);
    expect(workoutDetail(db, 1)?.entries[0]?.sets).toMatchObject([{ isCompleted: true, completedAt: null }]);
    expect(db.get('SELECT isCompleted, completedAt FROM workoutSet WHERE id = ?', [addedSet])).toEqual({
      isCompleted: 1,
      completedAt: null,
    });
    logger.removeExercise(entry);
    expect(workoutDetail(db, 1)?.entries.map((item) => item.entry.position)).toEqual([0]);
  });

  test('deleting the last historical set removes its exercise and closes exercise positions; live empty entries remain', async () => {
    const { db, logger } = await setup();
    const otherEntry = logger.addExercise(2, 1);
    for (const set of workoutDetail(db, 1)?.entries.find((item) => item.entry.id === 1)?.sets ?? [])
      logger.deleteSet(set.id);
    expect(workoutDetail(db, 1)?.entries.map((item) => [item.entry.id, item.entry.position])).toEqual([
      [otherEntry, 0],
    ]);
    logger.deleteSet(2);
    expect(workoutDetail(db, 2)?.entries).toHaveLength(1);
    expect(workoutDetail(db, 2)?.entries[0]?.sets).toEqual([]);
  });

  test('historical unit changes preserve exact kilograms, future defaults, and live sets', async () => {
    const { db, logger } = await setup();
    const before = workoutDetail(db, 1)?.entries[0]?.sets;
    logger.setEntryUnit('kg', 1);
    expect(workoutDetail(db, 1)?.entries[0]?.sets).toEqual(before?.map((set) => ({ ...set, entryUnit: 'kg' })));
    expect(db.value('SELECT defaultEntryUnit FROM exercise WHERE id = 1')).toBe('lb');
    expect(workoutDetail(db, 2)?.entries[0]?.sets[0]?.entryUnit).toBe('kg');
  });

  test('deleting a finished workout removes only its tree and adds the source-key tombstone', async () => {
    const { db, logger } = await setup();
    const before = DataSafetyFixture.read(db);
    logger.deleteFinished(1);
    const after = DataSafetyFixture.read(db);
    expect(after).toEqual({
      ...before,
      workout: before.workout?.filter((row) => row.id !== 1),
      workoutExercise: before.workoutExercise?.filter((row) => row.workoutId !== 1),
      workoutSet: before.workoutSet?.filter((row) => row.workoutExerciseId !== 1),
      appSetting: [...(before.appSetting ?? []), { key: 'deletedSourceKeys', value: '["strong:synthetic"]' }],
    });
  });

  test('edited imports keep source identity; deleted imports stay skipped after re-import and backup round trip', async () => {
    const { db, logger } = await setup();
    const plan = makeStrongImportPlan(parseStrongWorkoutsFile(OLDER_LAYOUT), [], makeImportOptions());
    importStrongPlan(db, plan, NOW);
    const imported = db.all<{ id: number }>("SELECT id FROM workout WHERE sourceKey LIKE 'strong:2024%' ORDER BY id");
    const first = imported[0]?.id;
    const second = imported[1]?.id;
    if (first === undefined || second === undefined) throw new Error('Missing synthetic imports');
    logger.updateFinished(first, { field: 'name', value: 'My correction' });
    logger.updateFinished(first, { field: 'startedAt', value: '2024-02-01T12:00:00.000Z' });
    expect(importStrongPlan(db, plan, NOW).workoutsAdded).toBe(0);
    expect(workoutDetail(db, first)?.workout.name).toBe('My correction');
    logger.deleteFinished(first);
    logger.deleteFinished(second);
    expect(strongImportWorkoutCounts(db, plan.workouts)).toEqual({ alreadyImported: 2, newWorkouts: 0 });
    const restored = await Database.fromBytes(db.exportBytes());
    databases.push(restored);
    expect(importStrongPlan(restored, plan, NOW)).toMatchObject({ workoutsAdded: 0, workoutsSkipped: 2, setsAdded: 0 });
    expect(workoutDetail(restored, first)).toBeUndefined();
    expect(workoutDetail(restored, second)).toBeUndefined();
    expect(WorkoutLogger.deletedSourceKeys(restored).size).toBe(2);
  });

  test('malformed tombstones block imported deletion and re-import atomically', async () => {
    const { db, logger } = await setup();
    const plan = makeStrongImportPlan(parseStrongWorkoutsFile(OLDER_LAYOUT), [], makeImportOptions());
    for (const value of ['invalid JSON', '{}', '["valid", 7]']) {
      db.run("INSERT OR REPLACE INTO appSetting (key, value) VALUES ('deletedSourceKeys', ?)", [value]);
      const before = DataSafetyFixture.read(db);
      expect(() => logger.deleteFinished(1)).toThrow('Deleted import records');
      expect(() => importStrongPlan(db, plan, NOW)).toThrow('Deleted import records');
      expect(DataSafetyFixture.read(db)).toEqual(before);
    }
  });
});
