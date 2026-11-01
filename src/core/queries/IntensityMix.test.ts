import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { intensityMix } from './IntensityMix';

let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
});
afterEach(() => db.close());
describe('intensity mix', () => {
  test('counts rep and effort buckets and calculates intensity from the known trend', () => {
    const date = new Date(2024, 0, 2, 12).toISOString();
    const exercise = db.run(
      `INSERT INTO exercise (name, source, createdAt, equipment, mechanic, tracking, movementPattern) VALUES ('Test', 'custom', ?, 'barbell', 'compound', 'weight-reps', 'horizontal-push')`,
      [date],
    ).lastInsertRowId;
    db.run(`INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (?, 'chest', 'primary')`, [exercise]);
    const workout = db.run(
      `INSERT INTO workout (name, source, startedAt, isInProgress) VALUES ('Test', 'strong', ?, 0)`,
      [date],
    ).lastInsertRowId;
    const entry = db.run(`INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 0)`, [
      workout,
      exercise,
    ]).lastInsertRowId;
    const sets = [
      [1, 10],
      [6, 9],
      [11, 8],
      [16, 7],
      [31, 6],
      [8, 5],
      [8, null],
    ];
    for (const [index, values] of sets.entries())
      db.run(
        `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (?, ?, 'working', 100, 'kg', ?, ?, 1)`,
        [entry, index, values[0] ?? 0, values[1] ?? null],
      );
    db.run(
      `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted) VALUES (?, 8, 'warmup', 100, 'kg', 8, 1)`,
      [entry],
    );
    const result = intensityMix(db, new Date(2024, 0, 1), new Date(2024, 0, 7), 'chest');
    expect(result.reps.map((bucket) => bucket.count)).toEqual([1, 2, 1, 1, 1]);
    expect(result.effort.map((bucket) => bucket.count)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(result.notLogged).toBe(1);
    expect(result.weeks[0]?.sets).toBe(6);
    expect(result.weeks[0]?.intensityPercent).toBeCloseTo(100 / (1 + 9 / 29));
    expect(intensityMix(db, new Date(2024, 0, 1), new Date(2024, 0, 7), 'biceps').weeks).toEqual([]);
  });
});

test('a session best prevents a lagging trend from producing over 100 percent', () => {
  db.run(
    "INSERT INTO exercise (id, name, source, createdAt, mechanic, tracking) VALUES (1, 'Test', 'custom', '2024-01-01', 'isolation', 'weight-reps')",
  );
  for (const [id, date, weight] of [
    [1, '2024-01-02T12:00:00.000Z', 50],
    [2, '2024-01-09T12:00:00.000Z', 100],
  ] as const) {
    db.run("INSERT INTO workout (id, name, source, startedAt, isInProgress) VALUES (?, 'Test', 'app', ?, 0)", [
      id,
      date,
    ]);
    db.run('INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (?, ?, 1, 0)', [id, id]);
    db.run(
      "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (?, 0, 'working', ?, 'kg', 1, 10, 1)",
      [id, weight],
    );
  }
  const mix = intensityMix(db, new Date(2024, 0, 9), new Date(2024, 0, 9));
  expect(mix.percentOfMax.map((bucket) => bucket.count)).toEqual([0, 0, 0, 0, 1]);
});
