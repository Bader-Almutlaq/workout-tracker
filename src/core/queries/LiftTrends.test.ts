import { afterEach, beforeEach, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { LiftTrends } from './LiftTrends';
let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
});
afterEach(() => db.close());
test('requires three qualifying sessions and excludes deload entries', () => {
  const exercise = db.run(
    `INSERT INTO exercise (name, source, createdAt, tracking, mechanic) VALUES ('Test', 'custom', '2024-01-01', 'weight-reps', 'isolation')`,
  ).lastInsertRowId;
  for (let day = 1; day <= 4; day++) {
    const id = db.run(`INSERT INTO workout (name, source, startedAt, isInProgress) VALUES ('Test', 'app', ?, 0)`, [
      `2024-01-0${day}T12:00:00.000Z`,
    ]).lastInsertRowId;
    const entry = db.run(
      `INSERT INTO workoutExercise (workoutId, exerciseId, position, machineBrand, deloadStage) VALUES (?, ?, 0, ?, ?)`,
      [id, exercise, day === 2 ? 'Second' : 'First', day === 4 ? 1 : null],
    ).lastInsertRowId;
    db.run(
      `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (?, 0, 'working', 100, 'kg', 1, 10, 1)`,
      [entry],
    );
  }
  const lifts = LiftTrends(db, new Date('2024-01-01T00:00:00Z'), new Date('2024-01-08T00:00:00Z'));
  expect(lifts).toHaveLength(1);
  expect(lifts[0]).toMatchObject({ sessions: 3, latest: 100, changePercent: 0, mixedMachines: true });
});

test('median ignores ordering and averages the middle two changes', async () => {
  const { medianLiftChange } = await import('./LiftTrends');
  const base = { id: 1, name: 'A', unit: 'kg' as const, sessions: 2, latest: 100, mixedMachines: false, points: [] };
  expect(
    medianLiftChange([
      { ...base, changePercent: 10 },
      { ...base, changePercent: -2 },
      { ...base, changePercent: 4 },
      { ...base, changePercent: 2 },
    ]),
  ).toBe(3);
  expect(medianLiftChange([])).toBeNull();
});

test('ranks changes and reports elapsed weeks since a best', () => {
  for (const [id, name, second] of [
    [1, 'Gain', 110],
    [2, 'Drop', 90],
  ] as const) {
    db.run(
      "INSERT INTO exercise (id, name, source, createdAt, tracking, mechanic) VALUES (?, ?, 'custom', '2024-01-01', 'weight-reps', 'isolation')",
      [id, name],
    );
    for (const [day, weight] of [
      [1, 100],
      [8, second],
    ] as const) {
      const workout = db.run(
        "INSERT INTO workout (name, source, startedAt, isInProgress) VALUES ('Test', 'app', ?, 0)",
        [`2024-01-${String(day).padStart(2, '0')}T12:00:00.000Z`],
      ).lastInsertRowId;
      const entry = db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 0)', [
        workout,
        id,
      ]).lastInsertRowId;
      db.run(
        "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (?, 0, 'working', ?, 'kg', 1, 10, 1)",
        [entry, weight],
      );
    }
  }
  const result = LiftTrends(db, new Date('2024-01-01T00:00:00Z'), new Date('2024-03-01T00:00:00Z'));
  expect(result.map((lift) => lift.name)).toEqual(['Gain', 'Drop']);
  expect(result[0]?.weeksSinceBest).toBe(7);
  expect(result[1]?.weeksSinceBest).toBe(8);
});
