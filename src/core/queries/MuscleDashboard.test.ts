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
