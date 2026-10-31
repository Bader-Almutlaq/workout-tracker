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
