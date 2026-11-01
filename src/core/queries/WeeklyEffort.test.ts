import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { WeeklyEffort } from './WeeklyEffort';

test('groups hard sets and logged effort into zero-filled weeks and filters muscle', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.run("INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Test', 'custom', '2024-01-01')");
  db.run("INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (1, 'chest', 'primary')");
  db.run(
    "INSERT INTO workout (id, name, source, startedAt, isInProgress) VALUES (1, 'Test', 'app', '2024-01-02T12:00:00.000Z', 0)",
  );
  db.run('INSERT INTO workoutExercise (id, workoutId, exerciseId, position, deloadStage) VALUES (1, 1, 1, 0, 1)');
  db.run(
    "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (1, 0, 'working', 50, 'kg', 8, 8, 1), (1, 1, 'working', 50, 'kg', 8, NULL, 1)",
  );
  const result = WeeklyEffort(db, new Date(2024, 0, 1), new Date(2024, 0, 14), 'chest');
  expect(result).toEqual([
    { weekStart: '2024-01-01', hardSets: 2, averageRir: 2, hasDeload: true },
    { weekStart: '2024-01-08', hardSets: 0, averageRir: null, hasDeload: false },
  ]);
  expect(WeeklyEffort(db, new Date(2024, 0, 1), new Date(2024, 0, 7), 'biceps')[0]?.hardSets).toBe(0);
  db.close();
});
