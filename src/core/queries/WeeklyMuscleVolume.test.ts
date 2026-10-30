import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { MUSCLES } from '../library/Muscle';
import type { HardSet } from '../analytics/HardSets';
import { weeklyMuscleVolume, WeeklyMuscleVolumeError } from './WeeklyMuscleVolume';

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

describe('weeklyMuscleVolume', () => {
  test('one set cannot acquire two roles for the same muscle or multiply through joins', () => {
    workout(new Date(2024, 0, 3), [hard, { ...hard, kind: 'drop' }, { ...hard, kind: 'failure' }]);
    expect(() =>
      db.run(
        `
      INSERT INTO exerciseMuscle (exerciseId, muscleId, role)
      VALUES (?, 'chest', 'secondary')
      `,
        [benchId],
      ),
    ).toThrow();
    const week = weeklyMuscleVolume(db, new Date(2024, 0, 3), new Date(2024, 0, 3))[0];
    // 3 performed sets × 1 primary = 3; × 0.5 secondary = 1.5, without join multiplication.
    expect(week?.muscles.find((row) => row.muscle === 'chest')?.totalSets).toBe(3);
    expect(week?.muscles.find((row) => row.muscle === 'triceps')?.totalSets).toBe(1.5);
  });

  test('counts the report bench example from finished imported data without end/completion timestamps', () => {
    workout(new Date(2024, 0, 3, 12), [hard]);
    const result = weeklyMuscleVolume(db, new Date(2024, 0, 3), new Date(2024, 0, 3));
    expect(result).toHaveLength(1);
    expect(result[0]?.weekStart).toBe('2024-01-01');
    expect(result[0]?.muscles.find((row) => row.muscle === 'chest')).toMatchObject({ directSets: 1, indirectSets: 0 });
    expect(result[0]?.muscles.find((row) => row.muscle === 'triceps')).toMatchObject({
      directSets: 0,
      indirectSets: 0.5,
    });
    expect(
      weeklyMuscleVolume(db, new Date(2024, 0, 1), new Date(2024, 0, 7), 0.3)[0]?.muscles.find(
        (row) => row.muscle === 'triceps',
      )?.totalSets,
    ).toBe(0.3);
  });

  test('includes zero weeks and all muscles in taxonomy order', () => {
    const result = weeklyMuscleVolume(db, new Date(2023, 11, 31), new Date(2024, 0, 8));
    expect(result.map((week) => week.weekStart)).toEqual(['2023-12-25', '2024-01-01', '2024-01-08']);
    for (const week of result) {
      expect(week.muscles.map((row) => row.muscle)).toEqual(MUSCLES);
      expect(week.muscles.every((row) => row.totalSets === 0)).toBe(true);
    }
  });

  test('uses local Monday midnight across year boundaries and excludes both outer weeks', () => {
    workout(new Date(2023, 11, 24, 23, 59), [hard]);
    workout(new Date(2023, 11, 25, 0, 0), [hard]);
    workout(new Date(2023, 11, 31, 23, 59), [hard]);
    workout(new Date(2024, 0, 1, 0, 0), [hard]);
    workout(new Date(2024, 0, 7, 23, 59), [hard]);
    workout(new Date(2024, 0, 8, 0, 0), [hard]);
    const result = weeklyMuscleVolume(db, new Date(2023, 11, 27), new Date(2024, 0, 3));
    expect(
      result.map((week) => [week.weekStart, week.muscles.find((row) => row.muscle === 'chest')?.totalSets]),
    ).toEqual([
      ['2023-12-25', 2],
      ['2024-01-01', 2],
    ]);
  });

  test('preserves calendar weeks spanning spring and autumn daylight-saving changes', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const ranges: readonly (readonly [Date, Date, Date, Date])[] = [
      [new Date(2024, 2, 10, 23, 59), new Date(2024, 2, 11), new Date(2024, 2, 4), new Date(2024, 2, 17)],
      [new Date(2024, 10, 3, 23, 59), new Date(2024, 10, 4), new Date(2024, 9, 28), new Date(2024, 10, 10)],
    ];
    for (const [sunday, monday, from, to] of ranges) {
      workout(sunday, [hard]);
      workout(monday, [hard]);
      const result = weeklyMuscleVolume(db, from, to);
      expect(result.map((week) => week.muscles.find((row) => row.muscle === 'chest')?.totalSets)).toEqual([1, 1]);
    }
  });

  test('excludes live workouts, planned sets, warmups and RIR above 4', () => {
    workout(new Date(2024, 0, 2), [hard], true);
    workout(new Date(2024, 0, 3), [
      { ...hard, kind: 'warmup', rpe: 10 },
      { ...hard, rpe: 5.5 },
      { ...hard, isCompleted: false },
      { ...hard, rpe: 6 },
      { ...hard, kind: 'drop', rpe: 7 },
      { ...hard, kind: 'failure', rpe: 2 },
      hard,
    ]);
    const result = weeklyMuscleVolume(db, new Date(2024, 0, 1), new Date(2024, 0, 1));
    expect(result[0]?.muscles.find((row) => row.muscle === 'chest')?.totalSets).toBe(4);
  });

  test('returns session IDs for >11 sets while retaining unmatched exercises without invented muscle tags', () => {
    const workoutId = workout(
      new Date(2024, 0, 3),
      Array.from({ length: 12 }, () => hard),
    );
    const unmatchedId = db.run(`
      INSERT INTO exercise (name, source, createdAt)
      VALUES ('Unmatched', 'strong', '2024-01-01T00:00:00.000Z')
    `).lastInsertRowId;
    const entryId = db.run(
      `
      INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 1)
    `,
      [workoutId, unmatchedId],
    ).lastInsertRowId;
    db.run(
      `
      INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps)
      VALUES (?, 0, 'working', 20, 'kg', 8)
    `,
      [entryId],
    );
    const result = weeklyMuscleVolume(db, new Date(2024, 0, 1), new Date(2024, 0, 1));
    expect(result[0]?.muscles.find((row) => row.muscle === 'chest')).toMatchObject({
      totalSets: 12,
      sessionsAboveSoftLimit: [workoutId],
    });
    expect(result[0]?.muscles.find((row) => row.muscle === 'triceps')).toMatchObject({
      totalSets: 6,
      sessionsAboveSoftLimit: [],
    });
  });

  test('returns no weeks for a reversed range', () => {
    expect(weeklyMuscleVolume(db, new Date(2024, 0, 8), new Date(2024, 0, 1))).toEqual([]);
  });

  test('rejects invalid date endpoints', () => {
    expect(() => weeklyMuscleVolume(db, new Date(NaN), new Date(2024, 0, 1))).toThrow(WeeklyMuscleVolumeError);
    expect(() => weeklyMuscleVolume(db, new Date(2024, 0, 1), new Date(NaN))).toThrow(WeeklyMuscleVolumeError);
  });
});
