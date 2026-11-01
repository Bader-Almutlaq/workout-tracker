import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { MuscleDashboard, MuscleDetail } from './MuscleDashboard';

test('uses the selected window for muscle sets, shares and direct effort', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.run(
    "INSERT INTO exercise (id, name, source, createdAt, tracking, mechanic) VALUES (1, 'Test', 'custom', '2024-01-01', 'weight-reps', 'isolation')",
  );
  db.run("INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (1, 'chest', 'primary')");
  for (const [id, date, rpe] of [
    [1, '2024-01-02T12:00:00.000Z', 8],
    [2, '2024-02-02T12:00:00.000Z', 9],
  ] as const) {
    db.run("INSERT INTO workout (id, name, source, startedAt, isInProgress) VALUES (?, 'Test', 'app', ?, 0)", [
      id,
      date,
    ]);
    db.run('INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (?, ?, 1, 0)', [id, id]);
    db.run(
      "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES (?, 0, 'working', 50, 'kg', 8, ?, 1)",
      [id, rpe],
    );
  }
  const from = new Date(2024, 0, 1);
  const to = new Date(2024, 0, 7);
  const chest = MuscleDashboard(db, from, to).find((item) => item.muscle === 'chest');
  expect(chest).toMatchObject({ setsPerWeek: 1, averageRir: 2, shares: [{ exerciseId: 1, sets: 1, percent: 100 }] });
  expect(MuscleDetail(db, from, to, 'chest').weekly[0]?.muscle?.totalSets).toBe(1);
  db.close();
});

test('muscle detail omits unlogged weeks and preserves zeros for sessions with no muscle hard sets', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.exec(`
      INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Press', 'custom', 'a');
      INSERT INTO exerciseMuscle VALUES (1, 'chest', 'primary');
      INSERT INTO workout (id, name, source, startedAt, isInProgress) VALUES
        (1, 'Hard', 'app', '2024-01-02T12:00:00.000Z', 0),
        (2, 'Easy', 'app', '2024-01-16T12:00:00.000Z', 0),
        (3, 'Unknown', 'app', '2024-01-23T12:00:00.000Z', 0),
        (4, 'Live', 'app', '2024-01-30T12:00:00.000Z', 1);
      INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES
        (1, 1, 1, 0), (2, 2, 1, 0), (3, 3, 1, 0), (4, 4, 1, 0);
      INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted) VALUES
        (1, 0, 'working', 50, 'kg', 8, 8, 1), (2, 0, 'working', 50, 'kg', 8, 5, 1),
        (3, 0, 'working', 50, 'kg', 8, NULL, 1), (4, 0, 'working', 50, 'kg', 8, 8, 1);
    `);
    const from = new Date(2024, 0, 1);
    const to = new Date(2024, 1, 4);
    const chest = MuscleDetail(db, from, to, 'chest');
    expect(chest.weekly.map((week) => ({ date: week.weekStart, sets: week.muscle?.totalSets }))).toEqual([
      { date: '2024-01-01', sets: 1 },
      { date: '2024-01-15', sets: 0 },
      { date: '2024-01-22', sets: 1 },
    ]);
    expect(chest.effort[2]?.averageRir).toBeNull();
    expect(MuscleDetail(db, from, to, 'biceps').weekly.map((week) => week.muscle?.totalSets)).toEqual([0, 0, 0]);
    expect(MuscleDetail(db, new Date(2024, 0, 3), new Date(2024, 0, 14), 'chest').weekly).toEqual([]);
  } finally {
    db.close();
  }
});
