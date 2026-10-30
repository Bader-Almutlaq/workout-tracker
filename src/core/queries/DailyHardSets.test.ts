import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import type { HardSet } from '../analytics/HardSets';
import { dailyHardSets, DailyHardSetsError } from './DailyHardSets';
import { weeklyMuscleVolume } from './WeeklyMuscleVolume';

let db: Database;
let benchId: number;

beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  benchId = db.run(`
    INSERT INTO exercise (name, source, createdAt)
    VALUES ('Synthetic Bench', 'custom', '2024-01-01T00:00:00.000Z')
  `).lastInsertRowId;
  db.run(
    `
    INSERT INTO exerciseMuscle (exerciseId, muscleId, role)
    VALUES (?, 'chest', 'primary'), (?, 'triceps', 'secondary')
  `,
    [benchId, benchId],
  );
});

afterEach(() => {
  db.close();
  vi.unstubAllEnvs();
});

function workout(date: Date, sets: readonly HardSet[], inProgress = false): number {
  const workoutId = db.run(
    `
    INSERT INTO workout (startedAt, name, source, isInProgress)
    VALUES (?, 'Synthetic', 'strong', ?)
  `,
    [date.toISOString(), inProgress ? 1 : 0],
  ).lastInsertRowId;
  const entryId = db.run(
    `
    INSERT INTO workoutExercise (workoutId, exerciseId, position)
    VALUES (?, ?, 0)
  `,
    [workoutId, benchId],
  ).lastInsertRowId;
  sets.forEach((set, position) =>
    db.run(
      `
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted)
    VALUES (?, ?, ?, 0, 'kg', 8, ?, ?)
  `,
      [entryId, position, set.kind, set.rpe, set.isCompleted ? 1 : 0],
    ),
  );
  return workoutId;
}

const hard: HardSet = { kind: 'working', rpe: null, isCompleted: true };

describe('dailyHardSets', () => {
  test('zero-fills inclusive local days and counts every hard set once despite multiple muscle tags', () => {
    workout(new Date(2024, 0, 2, 12), [hard, hard]);
    expect(dailyHardSets(db, { from: '2024-01-01', to: '2024-01-03' })).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 2 },
      { date: '2024-01-03', value: 0 },
    ]);
  });

  test('counts primary and secondary contributions using the weekly query helpers', () => {
    workout(new Date(2024, 0, 2, 12), [hard, hard, hard]);
    const range = { from: '2024-01-02', to: '2024-01-02' };
    expect(dailyHardSets(db, { ...range, muscleId: 'chest' })[0]?.value).toBe(3);
    expect(dailyHardSets(db, { ...range, muscleId: 'triceps' })[0]?.value).toBe(1.5);
    expect(dailyHardSets(db, { ...range, muscleId: 'biceps' })[0]?.value).toBe(0);
    const weekly = weeklyMuscleVolume(db, new Date(2024, 0, 2), new Date(2024, 0, 2));
    expect(weekly[0]?.muscles.find((muscle) => muscle.muscle === 'triceps')?.totalSets).toBe(1.5);
  });

  test('groups around local midnight instead of UTC midnight and excludes outer days', () => {
    vi.stubEnv('TZ', 'Asia/Riyadh');
    workout(new Date('2024-01-01T20:59:59.000Z'), [hard]);
    workout(new Date('2024-01-01T21:00:00.000Z'), [hard, hard]);
    workout(new Date('2024-01-02T21:00:00.000Z'), [hard]);
    expect(dailyHardSets(db, { from: '2024-01-02', to: '2024-01-02' })).toEqual([{ date: '2024-01-02', value: 2 }]);
  });

  test('increments civil days across daylight saving changes with a pinned timezone', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    for (const [month, day] of [
      [2, 10],
      [10, 3],
    ]) {
      if (month === undefined || day === undefined) throw new Error('Missing fixture date');
      workout(new Date(2024, month, day, 23, 59), [hard]);
    }
    expect(dailyHardSets(db, { from: '2024-03-09', to: '2024-03-11' }).map((point) => point.value)).toEqual([0, 1, 0]);
    expect(dailyHardSets(db, { from: '2024-11-02', to: '2024-11-04' }).map((point) => point.value)).toEqual([0, 1, 0]);
  });

  test('excludes warmups, incomplete sets, low effort and unfinished workouts', () => {
    workout(new Date(2024, 0, 2), [hard], true);
    workout(new Date(2024, 0, 2, 12), [
      { ...hard, kind: 'warmup', rpe: 10 },
      { ...hard, isCompleted: false },
      { ...hard, rpe: 5.5 },
      { ...hard, rpe: 6 },
      { ...hard, kind: 'drop', rpe: 7 },
      { ...hard, kind: 'failure', rpe: 2 },
      hard,
    ]);
    expect(dailyHardSets(db, { from: '2024-01-02', to: '2024-01-02' })[0]?.value).toBe(4);
  });

  test('includes completed sets from unmatched exercises for all training only', () => {
    db.run('DELETE FROM exerciseMuscle');
    workout(new Date(2024, 0, 2, 12), [hard]);
    expect(dailyHardSets(db, { from: '2024-01-02', to: '2024-01-02' })[0]?.value).toBe(1);
    expect(dailyHardSets(db, { from: '2024-01-02', to: '2024-01-02', muscleId: 'chest' })[0]?.value).toBe(0);
  });

  test('returns an empty series for reversed ranges and rejects invalid calendar dates', () => {
    expect(dailyHardSets(db, { from: '2024-01-03', to: '2024-01-01' })).toEqual([]);
    for (const invalid of ['invalid', '2024-02-30', '2024-01-01T00:00:00Z']) {
      expect(() => dailyHardSets(db, { from: invalid, to: '2024-03-01' })).toThrow(DailyHardSetsError);
      expect(() => dailyHardSets(db, { from: '2024-01-01', to: invalid })).toThrow(DailyHardSetsError);
    }
  });
});
