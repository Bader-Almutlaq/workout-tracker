import { afterEach, beforeEach, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { TrainingSummary } from './TrainingSummary';
let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
});
afterEach(() => db.close());
test('normalizes finished workouts and completed hard sets over whole weeks', () => {
  const exercise = db.run(
    `INSERT INTO exercise (name, source, createdAt) VALUES ('Test', 'custom', '2024-01-01')`,
  ).lastInsertRowId;
  const id = db.run(
    `INSERT INTO workout (name, source, startedAt, endedAt, isInProgress) VALUES ('Test', 'app', '2024-01-02T00:00:00.000Z', '2024-01-02T01:00:00.000Z', 0)`,
  ).lastInsertRowId;
  const entry = db.run(`INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 0)`, [
    id,
    exercise,
  ]).lastInsertRowId;
  for (const [position, kind, rpe] of [
    [0, 'working', 8],
    [1, 'warmup', 8],
    [2, 'working', 5],
  ] as const)
    db.run(
      `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (?, ?, ?, 10, 'kg', 5, ?, 1)`,
      [entry, position, kind, rpe],
    );
  db.run(
    `INSERT INTO workout (name, source, startedAt, isInProgress) VALUES ('Active', 'app', '2024-01-03T00:00:00.000Z', 1)`,
  );
  const result = TrainingSummary(db, new Date('2024-01-01T00:00:00Z'), new Date('2024-01-15T00:00:00Z'));
  expect(result).toMatchObject({ workoutsPerWeek: 0.5, hardSetsPerWeek: 0.5, secondsPerWeek: 1800, volumePerWeek: 50 });
  expect(result.workouts).toHaveLength(1);
});
test('returns zero for an empty previous period', () => {
  expect(TrainingSummary(db, new Date('2024-01-01T00:00:00Z'), new Date('2024-01-08T00:00:00Z')).workoutsPerWeek).toBe(
    0,
  );
});
