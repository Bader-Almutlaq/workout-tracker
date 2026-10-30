import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { workoutComparison } from './WorkoutComparison';

test('matches name without a template, excludes warmups, and reports added and removed exercises', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  const a = db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('A', 'custom', '2024')").lastInsertRowId;
  const b = db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('B', 'custom', '2024')").lastInsertRowId;
  const c = db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('C', 'custom', '2024')").lastInsertRowId;
  const first = db.run(
    "INSERT INTO workout (startedAt, name, source) VALUES ('2024-01-01', 'Push', 'app')",
  ).lastInsertRowId;
  const second = db.run(
    "INSERT INTO workout (startedAt, name, source) VALUES ('2024-01-02', 'Push', 'app')",
  ).lastInsertRowId;
  for (const [id, exercise, position] of [
    [first, a, 0],
    [first, b, 1],
    [second, a, 0],
    [second, c, 1],
  ]) {
    if (id === undefined || exercise === undefined || position === undefined) throw new Error('fixture');
    const entry = db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, ?)', [
      id,
      exercise,
      position,
    ]).lastInsertRowId;
    db.run(
      "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps) VALUES (?, 0, 'warmup', 100, 'kg', 5)",
      [entry],
    );
    db.run(
      "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps) VALUES (?, 1, 'working', 50, 'kg', 5)",
      [entry],
    );
  }
  expect(workoutComparison(db, first)).toBeNull();
  expect(workoutComparison(db, second)).toMatchObject({
    previousSetCount: 2,
    currentSetCount: 2,
    previousVolume: 500,
    added: ['C'],
    removed: ['B'],
  });
  expect(workoutComparison(db, second)?.exercises[0]?.current?.weightKilograms).toBe(50);
  db.close();
});

test('matches the template even when names differ and does not fall back to name for a template', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  const template = db.run(
    "INSERT INTO template (name, position, createdAt, updatedAt) VALUES ('A', 0, '2024', '2024')",
  ).lastInsertRowId;
  const other = db.run(
    "INSERT INTO template (name, position, createdAt, updatedAt) VALUES ('B', 1, '2024', '2024')",
  ).lastInsertRowId;
  const first = db.run(
    "INSERT INTO workout (startedAt, name, source, templateId) VALUES ('2024-01-01', 'Old', 'app', ?)",
    [template],
  ).lastInsertRowId;
  db.run("INSERT INTO workout (startedAt, name, source, templateId) VALUES ('2024-01-02', 'New', 'app', ?)", [other]);
  const current = db.run(
    "INSERT INTO workout (startedAt, name, source, templateId) VALUES ('2024-01-03', 'New', 'app', ?)",
    [template],
  ).lastInsertRowId;
  expect(workoutComparison(db, current)?.previous.workout.id).toBe(first);
  db.close();
});
