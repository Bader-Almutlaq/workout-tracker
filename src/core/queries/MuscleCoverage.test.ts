import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { muscleCoverage } from './MuscleCoverage';

let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
});
afterEach(() => db.close());
function add(
  name: string,
  pattern: string,
  muscle: string,
  role: string,
  date: Date,
  count: number,
  kind = 'working',
  inProgress = 0,
) {
  const exercise = db.run(
    `INSERT INTO exercise (name, source, createdAt, movementPattern) VALUES (?, 'custom', ?, ?)`,
    [name, date.toISOString(), pattern],
  ).lastInsertRowId;
  db.run(`INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (?, ?, ?)`, [exercise, muscle, role]);
  const workout = db.run(
    `INSERT INTO workout (name, source, startedAt, isInProgress) VALUES ('Test', 'strong', ?, ?)`,
    [date.toISOString(), inProgress],
  ).lastInsertRowId;
  const entry = db.run(`INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 0)`, [
    workout,
    exercise,
  ]).lastInsertRowId;
  for (let index = 0; index < count; index += 1)
    db.run(
      `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted) VALUES (?, ?, ?, 20, 'kg', 8, 1)`,
      [entry, index, kind],
    );
}
describe('muscle coverage', () => {
  test('uses daily fractional threshold, trailing window, shares and excludes warmups and live sessions', () => {
    add('A', 'horizontal-push', 'chest', 'primary', new Date(2024, 0, 2), 2);
    add('B', 'horizontal-push', 'chest', 'primary', new Date(2024, 0, 3), 1);
    add('C', 'elbow-extension', 'triceps', 'secondary', new Date(2024, 0, 2), 1);
    add('D', 'elbow-extension', 'triceps', 'secondary', new Date(2024, 0, 3), 2);
    add('E', 'horizontal-push', 'chest', 'primary', new Date(2024, 0, 4), 10, 'warmup');
    add('F', 'horizontal-push', 'chest', 'primary', new Date(2024, 0, 5), 10, 'working', 1);
    const result = muscleCoverage(db, new Date(2024, 0, 1), new Date(2024, 0, 7));
    expect(result.muscles.find((item) => item.muscle === 'chest')).toMatchObject({
      setsPerWeek: 3,
      daysPerWeek: 2,
      daysSince: 4,
    });
    expect(result.muscles.find((item) => item.muscle === 'triceps')).toMatchObject({
      setsPerWeek: 1.5,
      daysPerWeek: 1,
      daysSince: null,
    });
    expect(result.shares.chest?.[0]?.percent).toBeCloseTo(200 / 3);
    expect(result.shares.chest?.[1]?.percent).toBeCloseTo(100 / 3);
    expect(result.shares.chest?.reduce((sum, item) => sum + item.percent, 0)).toBeCloseTo(100);
    expect(result.neglected.some((item) => item.muscle === 'chest')).toBe(true);
    expect(result.neglected.some((item) => item.muscle === 'neck')).toBe(false);
  });
  test('neglected uses exactly the final 28 days, independent of the selected start', () => {
    add('Old', 'horizontal-push', 'chest', 'primary', new Date(2023, 11, 10), 16);
    add('Recent', 'horizontal-pull', 'lats', 'primary', new Date(2024, 0, 7), 16);
    const result = muscleCoverage(db, new Date(2023, 11, 1), new Date(2024, 0, 7));
    expect(result.neglected.some((item) => item.muscle === 'chest')).toBe(true);
    expect(result.neglected.some((item) => item.muscle === 'lats')).toBe(false);
  });
  test('counts each pattern once and returns no ratio if a side is zero', () => {
    for (const [index, pattern] of [
      'horizontal-push',
      'horizontal-pull',
      'vertical-push',
      'vertical-pull',
      'squat',
      'hinge',
    ].entries())
      add(`Exercise ${index}`, pattern, 'chest', 'primary', new Date(2024, 0, 2), index + 1);
    const ratios = muscleCoverage(db, new Date(2024, 0, 1), new Date(2024, 0, 7)).ratios;
    expect(ratios.map((item) => [item.first, item.second])).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [10, 11],
    ]);
    expect(
      muscleCoverage(db, new Date(2024, 1, 1), new Date(2024, 1, 7)).ratios.every((item) => item.ratio === null),
    ).toBe(true);
  });
});
