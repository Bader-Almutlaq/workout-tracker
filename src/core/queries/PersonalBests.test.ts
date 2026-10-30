import { expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { personalBestCounts, personalBestsForWorkout } from './PersonalBests';

async function fixture() {
  const db = await Database.openInMemory();
  migrate(db);
  const exercise = db.run(
    `INSERT INTO exercise (name, source, createdAt, equipment, movementPattern, mechanic) VALUES ('Bench', 'custom', '2024', 'barbell', 'horizontal-push', 'compound')`,
  ).lastInsertRowId;
  function workout(date: string, sets: readonly (readonly [number, number, string])[]) {
    const id = db.run(`INSERT INTO workout (startedAt, name, source) VALUES (?, 'Push', 'app')`, [
      date,
    ]).lastInsertRowId;
    const entry = db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 0)', [
      id,
      exercise,
    ]).lastInsertRowId;
    sets.forEach(([weight, reps, kind], position) =>
      db.run(
        `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe) VALUES (?, ?, ?, ?, 'kg', ?, 8)`,
        [entry, position, kind, weight, reps],
      ),
    );
    return id;
  }
  return { db, workout };
}

test('records all kinds against earlier workouts and collapses rep records', async () => {
  const { db, workout } = await fixture();
  const first = workout('2024-01-01', [
    [100, 5, 'working'],
    [300, 5, 'warmup'],
  ]);
  const second = workout('2024-01-02', [
    [110, 5, 'working'],
    [80, 10, 'drop'],
  ]);
  expect(personalBestsForWorkout(db, first)).toEqual([]);
  const bests = personalBestsForWorkout(db, second);
  expect(bests.map((best) => best.kind)).toEqual(['e1rm', 'weight', 'setVolume', 'sessionVolume', 'reps']);
  expect(bests.find((best) => best.kind === 'reps')).toMatchObject({ value: 110, previous: 100, reps: 5 });
  expect(bests.find((best) => best.kind === 'sessionVolume')).toMatchObject({ value: 1350, previous: 500 });
  expect(bests.find((best) => best.kind === 'setVolume')).toMatchObject({ value: 800, previous: 500 });
  expect(bests.find((best) => best.kind === 'e1rm')?.value).toBeCloseTo(110 * (1 + 6 / 29));
  expect(bests.find((best) => best.kind === 'e1rm')?.previous).toBeCloseTo(100 * (1 + 6 / 29));
  expect(personalBestCounts(db)[second]).toBe(5);
  db.close();
});

test('ties and weights within one hundredth of a kilogram do not set records', async () => {
  const { db, workout } = await fixture();
  workout('2024-01-01', [[61.23, 5, 'working']]);
  const tied = workout('2024-01-02', [[61.235, 5, 'working']]);
  expect(personalBestsForWorkout(db, tied).filter((best) => best.kind === 'weight' || best.kind === 'reps')).toEqual(
    [],
  );
  db.close();
});

test('counts a synthetic 1000 workout history within one second', async () => {
  const { db, workout } = await fixture();
  db.transaction(() => {
    for (let index = 0; index < 1000; index += 1)
      workout(
        String(index).padStart(5, '0'),
        Array.from({ length: 25 }, () => [100, 5, 'working'] as const),
      );
  });
  const start = Date.now();
  personalBestCounts(db);
  expect(Date.now() - start).toBeLessThan(1000);
  db.close();
});
