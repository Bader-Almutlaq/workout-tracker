import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { previousPerformance } from './PreviousPerformance';

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
