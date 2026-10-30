import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { DataSafetyFixture } from '../db/fixtures/DataSafetyFixture';
import { migrate } from '../db/migrations';
import { workoutDetail, workoutSummaries, workoutSummary } from '../queries/WorkoutHistory';
import { liveWorkoutSnapshot } from '../queries/LiveWorkout';
import { previousPerformance } from '../queries/PreviousPerformance';
import { toKilograms } from '../units/Weight';
import { WorkoutLogger } from './WorkoutLogger';
import { WorkoutLoggerError } from './WorkoutLoggerError';

const now = new Date('2026-02-01T10:00:00.000Z');
async function fixture() {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, source, defaultEntryUnit, createdAt) VALUES (1, 'Bench Press (Barbell)', 'custom', 'lb', '2026-01-01');
    INSERT INTO exercise (id, name, source, createdAt) VALUES (2, 'Squat (Barbell)', 'custom', '2026-01-01');
    INSERT INTO workout (id, startedAt, endedAt, name, source) VALUES (1, '2026-01-01 10:00:00', '2026-01-01 11:00:00', 'Push', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe) VALUES
      (1, 0, 'warmup', 40, 'kg', 10, NULL), (1, 1, 'working', 61.23497, 'lb', 8, 8), (1, 2, 'working', 61.23497, 'lb', 7, 9);
  `);
  return { db, logger: new WorkoutLogger(db) };
}
function sets(db: Database, entry: number) {
  return db.all<{
    id: number;
    kind: string;
    reps: number;
    entryUnit: string;
    weightKilograms: number;
    position: number;
    isCompleted: number;
    completedAt: string | null;
    restBeforeSeconds: number | null;
    durationSeconds: number | null;
  }>('SELECT * FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position', [entry]);
}
function setup(logger: WorkoutLogger, exercise = 1) {
  const workout = logger.start('Push', now);
  const entry = logger.addExercise(exercise, workout);
  return { workout, entry };
}
function idAt(db: Database, entry: number, index: number): number {
  const id = sets(db, entry)[index]?.id;
  if (id === undefined) throw new Error('Missing set');
  return id;
}

describe('Logging a workout live', () => {
  test('Only one workout can be in progress', async () => {
    const { logger } = await fixture();
    const id = logger.start('Push', now);
    expect(logger.activeWorkoutId()).toBe(id);
    expect(() => logger.start('Again', now)).toThrow(new WorkoutLoggerError('workoutAlreadyInProgress', id));
  });
  test('Adding an exercise pre-fills last session sets as planned in the exercise unit', async () => {
    const { db, logger } = await fixture();
    const { entry } = setup(logger);
    const planned = sets(db, entry);
    expect(planned.map((set) => set.kind)).toEqual(['warmup', 'working', 'working']);
    expect(planned.map((set) => set.reps)).toEqual([10, 8, 7]);
    expect(planned.every((set) => set.isCompleted === 0 && set.entryUnit === 'lb')).toBe(true);
    expect(planned[1]?.weightKilograms).toBe(61.23497);
  });
  test('An exercise never done before gets one empty planned set', async () => {
    const { db, logger } = await fixture();
    const { entry } = setup(logger, 2);
    expect(sets(db, entry)).toHaveLength(1);
    expect(sets(db, entry)[0]).toMatchObject({ reps: 0, entryUnit: 'kg' });
  });
  test('Completing sets records time and rest since the previous completed set', async () => {
    const { db, logger } = await fixture();
    const { entry } = setup(logger);
    logger.setCompleted(idAt(db, entry, 0), true, new Date(now.getTime() + 60000));
    logger.setCompleted(idAt(db, entry, 1), true, new Date(now.getTime() + 210000));
    expect(sets(db, entry).map((set) => set.restBeforeSeconds)).toEqual([null, 150, null]);
    logger.setCompleted(idAt(db, entry, 1), false, now);
    expect(sets(db, entry)[1]?.completedAt).toBeNull();
  });
  test('Updating validates numbers and stores kg exactly with the typed unit', async () => {
    const { db, logger } = await fixture();
    const { entry } = setup(logger);
    const id = idAt(db, entry, 1);
    logger.updateSet(id, toKilograms(140, 'lb'), 'lb', 6, 8.5, 'working');
    expect(sets(db, entry)[1]).toMatchObject({ weightKilograms: toKilograms(140, 'lb'), reps: 6 });
    expect(() => logger.updateSet(id, 50, 'kg', -1, null, 'working')).toThrow(
      new WorkoutLoggerError('invalidReps', -1),
    );
    expect(() => logger.updateSet(id, 50, 'kg', 5, 11, 'working')).toThrow(new WorkoutLoggerError('invalidRPE', 11));
  });
  test('Adding a set copies the last one; deleting closes the gap', async () => {
    const { db, logger } = await fixture();
    const { entry } = setup(logger);
    logger.addSet(entry);
    expect(sets(db, entry)).toHaveLength(4);
    expect(sets(db, entry)[3]?.reps).toBe(7);
    logger.deleteSet(idAt(db, entry, 1));
    expect(sets(db, entry).map((set) => set.position)).toEqual([0, 1, 2]);
  });
  test('Exercises can be moved and removed; positions stay dense', async () => {
    const { db, logger } = await fixture();
    const { workout, entry } = setup(logger);
    const squat = logger.addExercise(2, workout);
    logger.moveExercise(squat, 0);
    expect(
      db
        .all<{ id: number }>('SELECT id FROM workoutExercise WHERE workoutId = ? ORDER BY position', [workout])
        .map((row) => row.id),
    ).toEqual([squat, entry]);
    logger.removeExercise(squat);
    expect(
      db
        .all<{ position: number }>('SELECT position FROM workoutExercise WHERE workoutId = ?', [workout])
        .map((row) => row.position),
    ).toEqual([0]);
  });
  test('Finishing drops planned sets and empty exercises, and ends the workout', async () => {
    const { db, logger } = await fixture();
    const { workout, entry } = setup(logger);
    logger.addExercise(2, workout);
    const id = idAt(db, entry, 1);
    logger.setCompleted(id, true, now);
    const end = new Date('2026-02-01T11:00:00.000Z');
    expect(logger.finish(workout, end)).toEqual({ workoutId: workout, completedSets: 1, droppedSets: 3 });
    expect(workoutDetail(db, workout)?.workout).toMatchObject({ isInProgress: false, endedAt: end.toISOString() });
    expect(workoutDetail(db, workout)?.entries).toHaveLength(1);
    expect(sets(db, entry)[0]?.position).toBe(0);
    expect(logger.activeWorkoutId()).toBeUndefined();
  });
  test('Finishing with nothing completed deletes the workout', async () => {
    const { db, logger } = await fixture();
    const { workout } = setup(logger);
    expect(logger.finish(workout, now).workoutId).toBeNull();
    expect(workoutDetail(db, workout)).toBeUndefined();
  });
  test('The live snapshot pairs each exercise with last time; history hides active workout', async () => {
    const { db, logger } = await fixture();
    const { workout } = setup(logger);
    expect(liveWorkoutSnapshot(db, workout)?.entries).toHaveLength(1);
    expect(liveWorkoutSnapshot(db, workout)?.entries[0]?.previous.map((set) => set.reps)).toEqual([10, 8, 7]);
    expect(workoutSummaries(db).map((item) => item.id)).toEqual([1]);
  });
  test('Previous performance ignores planned sets and the workout in progress', async () => {
    const { db, logger } = await fixture();
    setup(logger);
    expect(previousPerformance(db, 1)).toHaveLength(3);
  });
  test('Switching unit changes default and planned sets only; weights stay in kg', async () => {
    const { db, logger } = await fixture();
    const { entry } = setup(logger);
    logger.setCompleted(idAt(db, entry, 0), true, now);
    logger.setEntryUnit('kg', entry);
    expect(sets(db, entry)[0]?.entryUnit).toBe('lb');
    expect(sets(db, entry)[1]).toMatchObject({ entryUnit: 'kg', weightKilograms: 61.23497 });
    expect(db.value('SELECT defaultEntryUnit FROM exercise WHERE id = 1')).toBe('kg');
  });
  test('Pre-filled and added sets keep duration; a finished workout has a summary', async () => {
    const { db, logger } = await fixture();
    db.exec(`
      INSERT INTO exercise (id, name, source, tracking, createdAt) VALUES (3, 'Plank', 'custom', 'duration', '2026-01-01');
      INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (9, 1, 3, 1);
      INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, durationSeconds) VALUES (9, 0, 'working', 0, 'kg', 0, 75);
    `);
    const { workout, entry } = setup(logger, 3);
    logger.addSet(entry);
    expect(sets(db, entry).map((set) => set.durationSeconds)).toEqual([75, 75]);
    logger.setCompleted(idAt(db, entry, 0), true, now);
    logger.finish(workout, now);
    expect(workoutSummary(db, workout)?.setCount).toBe(1);
    expect(workoutSummary(db, 999)).toBeUndefined();
  });
});

test('Starting from a template uses template set counts and kinds with history and defaults', async () => {
  const { db, logger } = await fixture();
  db.exec(`INSERT INTO template (id, name, position, createdAt, updatedAt) VALUES (1, 'Plan', 0, 'a', 'a');
    INSERT INTO templateExercise (id, templateId, exerciseId, position, supersetGroup) VALUES (1, 1, 1, 0, 4), (2, 1, 2, 1, 4);
    INSERT INTO templateSet (templateExerciseId, position, kind, targetRepsLow) VALUES (1, 0, 'drop', 5), (1, 1, 'failure', 6), (2, 0, 'working', 12);`);
  const workout = logger.startFromTemplate(1, now);
  const entries = db.all<{ id: number; supersetGroup: number }>(
    'SELECT id, supersetGroup FROM workoutExercise WHERE workoutId = ? ORDER BY position',
    [workout],
  );
  expect(entries.map((entry) => entry.supersetGroup)).toEqual([4, 4]);
  const first = entries[0];
  const second = entries[1];
  if (first === undefined || second === undefined) throw new Error('Missing entries');
  expect(sets(db, first.id).map((set) => [set.kind, set.reps])).toEqual([
    ['drop', 8],
    ['failure', 7],
  ]);
  expect(sets(db, second.id)[0]).toMatchObject({ weightKilograms: 0, reps: 12 });
  expect(db.get('SELECT name, templateId FROM workout WHERE id = ?', [workout])).toEqual({
    name: 'Plan',
    templateId: 1,
  });
  expect(db.value('SELECT lastStartedAt FROM template WHERE id = 1')).toBeNull();
  expect(() => logger.startFromTemplate(1, now)).toThrow(new WorkoutLoggerError('workoutAlreadyInProgress', workout));
});

test('Starting a template for a timed exercise puts the target in seconds, not reps', async () => {
  const { db, logger } = await fixture();
  db.exec(`INSERT INTO exercise (id, name, source, tracking, createdAt) VALUES (30, 'Plank Hold', 'custom', 'duration', 'a');
    INSERT INTO template (id, name, position, createdAt, updatedAt) VALUES (1, 'Core', 0, 'a', 'a');
    INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 30, 0);
    INSERT INTO templateSet (templateExerciseId, position, kind, targetRepsLow) VALUES (1, 0, 'working', 45);`);
  const workout = logger.startFromTemplate(1, now);
  const entry = db.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ?', [workout]) ?? -1;
  expect(sets(db, entry)[0]).toMatchObject({ reps: 0, durationSeconds: 45 });
});

describe('data safety regressions', () => {
  test('finishing twice keeps the original end time and every stored row', async () => {
    const { db, logger } = await fixture();
    const { workout, entry } = setup(logger);
    logger.setCompleted(idAt(db, entry, 1), true, now);
    logger.finish(workout, now);
    const before = db.exportBytes();
    expect(logger.finish(workout, new Date('2026-02-02T00:00:00Z'))).toEqual({
      workoutId: workout,
      completedSets: 1,
      droppedSets: 0,
    });
    expect(db.exportBytes()).toEqual(before);
  });

  test('finishing an empty workout twice is harmless', async () => {
    const { db, logger } = await fixture();
    const { workout } = setup(logger);
    logger.finish(workout, now);
    const before = db.exportBytes();
    expect(logger.finish(workout, now)).toEqual({ workoutId: null, completedSets: 0, droppedSets: 0 });
    expect(db.exportBytes()).toEqual(before);
  });
});

test('each live mutation survives reopening, and discard touches only its own workout tree', async () => {
  let db = await Database.openInMemory();
  migrate(db);
  DataSafetyFixture.seed(db);
  const unrelated = DataSafetyFixture.read(db);
  let logger = new WorkoutLogger(db);
  const reload = async () => {
    const before = DataSafetyFixture.read(db);
    const bytes = db.exportBytes();
    db.close();
    db = await Database.fromBytes(bytes);
    logger = new WorkoutLogger(db);
    expect(DataSafetyFixture.read(db)).toEqual(before);
    expect(logger.activeWorkoutId()).toBe(2);
  };
  logger.update(2, 'Live name', 'Live notes');
  await reload();
  const entry = logger.addExercise(1, 2);
  await reload();
  logger.moveExercise(entry, 0);
  await reload();
  const set = logger.addSet(entry);
  await reload();
  logger.updateSet(set, 63.123456789, 'lb', 9, 8.5, 'drop', 73.25);
  await reload();
  logger.setCompleted(set, true, now);
  await reload();
  logger.setEntryUnit('kg', entry);
  await reload();
  logger.deleteSet(set);
  await reload();
  logger.removeExercise(entry);
  await reload();
  logger.discard(2);
  const discarded = await Database.fromBytes(db.exportBytes());
  expect(new WorkoutLogger(discarded).activeWorkoutId()).toBeUndefined();
  const expected = {
    ...unrelated,
    workout: unrelated.workout?.filter((row) => row.id !== 2),
    workoutExercise: unrelated.workoutExercise?.filter((row) => row.workoutId !== 2),
    workoutSet: unrelated.workoutSet?.filter((row) => row.workoutExerciseId !== 2),
  };
  const actual = DataSafetyFixture.read(discarded);
  for (const [name, rows] of Object.entries(expected)) {
    // AUTOINCREMENT ids remain consumed after explicit deletions; an exercise's chosen unit is intentionally remembered.
    if (name === 'sqlite_sequence' || name === 'exercise') continue;
    expect(actual[name]).toEqual(rows);
  }
  expect(actual.exercise).toEqual(
    unrelated.exercise?.map((row) => (row.id === 1 ? { ...row, defaultEntryUnit: 'kg' } : row)),
  );
  db.close();
  discarded.close();
});

test('invalid durations cannot replace an existing set or silently become NULL in SQLite', async () => {
  const { db, logger } = await fixture();
  const { entry } = setup(logger);
  const id = idAt(db, entry, 0);
  logger.updateSet(id, 50, 'kg', 8, 8, 'working', 65.5);
  const before = DataSafetyFixture.read(db);
  for (const duration of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1]) {
    expect(() => logger.updateSet(id, 60, 'lb', 9, 9, 'drop', duration)).toThrow(
      new WorkoutLoggerError('invalidDuration', duration),
    );
    expect(DataSafetyFixture.read(db)).toEqual(before);
  }
  db.close();
});

test('repeating a completion request preserves its original timestamp and rest', async () => {
  const { db, logger } = await fixture();
  const { entry } = setup(logger);
  const id = idAt(db, entry, 0);
  logger.setCompleted(id, true, now);
  const before = DataSafetyFixture.read(db);
  logger.setCompleted(id, true, new Date(now.getTime() + 60000));
  expect(DataSafetyFixture.read(db)).toEqual(before);
  db.close();
});

test('Discard leaves the template stamp unchanged; finishing stamps its start', async () => {
  const { db, logger } = await fixture();
  db.exec(`INSERT INTO template (id, name, position, createdAt, updatedAt, lastStartedAt) VALUES (1, 'Plan', 0, 'a', 'a', 'old');
    INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO templateSet (templateExerciseId, position, kind) VALUES (1, 0, 'working');`);
  const discarded = logger.startFromTemplate(1, now);
  logger.discard(discarded);
  expect(db.value('SELECT lastStartedAt FROM template WHERE id = 1')).toBe('old');
  const workout = logger.startFromTemplate(1, now);
  const entry = db.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ?', [workout]) ?? -1;
  logger.setCompleted(idAt(db, entry, 0), true, now);
  logger.finish(workout, now);
  expect(db.value('SELECT lastStartedAt FROM template WHERE id = 1')).toBe(now.toISOString());
});

test('Template matches warm-ups and work sets independently and falls back to targets', async () => {
  const { db, logger } = await fixture();
  db.exec(`INSERT INTO template (id, name, position, createdAt, updatedAt) VALUES (1, 'Plan', 0, 'a', 'a');
    INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO templateSet (templateExerciseId, position, kind, targetRepsLow) VALUES
      (1, 0, 'working', 5), (1, 1, 'warmup', 6), (1, 2, 'drop', 7), (1, 3, 'failure', 12), (1, 4, 'warmup', 15);`);
  const workout = logger.startFromTemplate(1, now);
  const entry = db.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ?', [workout]) ?? -1;
  expect(sets(db, entry).map((set) => [set.kind, set.reps])).toEqual([
    ['working', 8],
    ['warmup', 10],
    ['drop', 7],
    ['failure', 12],
    ['warmup', 15],
  ]);
});
