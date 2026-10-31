import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import {
  machinePreviousPerformance,
  matchPreviousSets,
  previousPerformance,
  usedMachineBrands,
} from './PreviousPerformance';

test('previous performance combines repeated entries in order and honors exclusion', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Squat', 'custom', '2026-01-01');
    INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01', 'Legs', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0), (2, 1, 1, 1);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted)
      VALUES (1, 0, 'working', 100, 'kg', 8, 1), (2, 0, 'working', 90, 'kg', 10, 1), (2, 1, 'working', 90, 'kg', 9, 0);
  `);
  expect(previousPerformance(db, 1).map((set) => set.reps)).toEqual([8, 10]);
  expect(previousPerformance(db, 1, 1)).toEqual([]);
});

test('matches last time by warm-up and work order even when kinds are interleaved or missing', () => {
  const previous = [
    { kind: 'warmup', value: 1 },
    { kind: 'working', value: 2 },
    { kind: 'drop', value: 3 },
  ];
  const current = [{ kind: 'working' }, { kind: 'warmup' }, { kind: 'failure' }, { kind: 'warmup' }];
  expect(matchPreviousSets(current, previous).map((set) => set?.value)).toEqual([2, 1, 3, undefined]);
});

test('machine matching respects occurrence and falls back without mixing repeated entries', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Press', 'custom', '2026-01-01');
    INSERT INTO workout (id, startedAt, name, source) VALUES
      (1, '2026-01-01', 'Older', 'app'), (2, '2026-01-02', 'Newer', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position, machineBrand) VALUES
      (1, 1, 1, 0, 'Panatta'), (2, 1, 1, 1, 'Atlas'),
      (3, 2, 1, 0, 'Atlas'), (4, 2, 1, 1, 'Panatta');
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted) VALUES
      (1, 0, 'working', 10, 'kg', 1, 1), (2, 0, 'working', 20, 'kg', 2, 1),
      (3, 0, 'working', 30, 'kg', 3, 1), (4, 0, 'working', 40, 'kg', 4, 1);
  `);
  const same = machinePreviousPerformance(db, 1, null, null, 0, 'panatta');
  expect(same.sets.map((set) => set.reps)).toEqual([1]);
  expect(same.otherMachine).toBe(false);
  const fallback = machinePreviousPerformance(db, 1, null, null, 0, 'Unknown');
  expect(fallback.sets.map((set) => set.reps)).toEqual([3]);
  expect(fallback.otherMachine).toBe(true);
  expect(machinePreviousPerformance(db, 1, null, null, null, null).sets.map((set) => set.reps)).toEqual([3, 4]);
  expect(usedMachineBrands(db)).toEqual(['Panatta', 'Atlas']);
  db.close();
});
