import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import type { WorkoutSet } from '../models/WorkoutSet';
import { ExerciseStrength } from './ExerciseStrength';

let db: Database;
const now = new Date('2026-01-31T23:59:59.999Z');

beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, equipment, movementPattern, mechanic, source, createdAt)
    VALUES (1, 'Bench', 'barbell', 'horizontal-push', 'compound', 'custom', '2026-01-01'),
           (2, 'Squat', 'barbell', 'squat', 'compound', 'custom', '2026-01-01');
  `);
});

afterEach(() => {
  db.close();
  vi.unstubAllEnvs();
});

function workout(startedAt: string, isInProgress = false): number {
  return db.run(
    `
    INSERT INTO workout (startedAt, name, source, isInProgress)
    VALUES (?, 'Synthetic session', 'app', ?)
    `,
    [startedAt, isInProgress ? 1 : 0],
  ).lastInsertRowId;
}

function entry(workoutId: number, exerciseId = 1, position = 0): number {
  return db.run(
    `
    INSERT INTO workoutExercise (workoutId, exerciseId, position)
    VALUES (?, ?, ?)
    `,
    [workoutId, exerciseId, position],
  ).lastInsertRowId;
}

function addSet(
  entryId: number,
  changes: Partial<Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps' | 'rpe' | 'isCompleted' | 'entryUnit'>> = {},
): void {
  const set = {
    kind: 'working',
    weightKilograms: 100,
    reps: 5,
    rpe: 8,
    isCompleted: true,
    entryUnit: 'kg',
    ...changes,
  };
  db.run(
    `
    INSERT INTO workoutSet
      (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, isCompleted)
    VALUES (?, (SELECT COUNT(*) FROM workoutSet WHERE workoutExerciseId = ?), ?, ?, ?, ?, ?, ?)
    `,
    [entryId, entryId, set.kind, set.weightKilograms, set.entryUnit, set.reps, set.rpe, set.isCompleted ? 1 : 0],
  );
}

describe('ExerciseStrength.series', () => {
  it('uses civil days for the inclusive 28-day rate boundary west of UTC', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    addSet(entry(workout('2026-01-01T20:00:00.000Z')), { reps: 1, rpe: 10 });
    addSet(entry(workout('2026-01-08T20:00:00.000Z')), { weightKilograms: 110, reps: 1, rpe: 10 });
    // Jan 29 at 23:30 PST is Jan 30 UTC. Jan 1 is still exactly 28 civil days ago.
    const result = ExerciseStrength.series(db, 1, new Date('2026-01-30T07:30:00.000Z'));
    // 100 + (1 − exp(−7/21))×10 = 102.8346868942621; one week → +2.8346868942621%.
    expect(result.latest).toBeCloseTo(102.8346868942621, 12);
    expect(result.changePerWeekPercent).toBeCloseTo(2.8346868942621, 12);
    expect(ExerciseStrength.series(db, 1, new Date('2026-01-30T08:00:00.000Z')).changePerWeekPercent).toBeNull();
  });

  it('includes today in the trend just after local midnight east of UTC', () => {
    vi.stubEnv('TZ', 'Asia/Riyadh');
    addSet(entry(workout('2026-01-01T21:05:00.000Z')), { reps: 1, rpe: 10 });
    // 00:05 on Jan 2 locally is still Jan 1 UTC. A true 100 kg single seeds exactly 100 kg.
    const result = ExerciseStrength.series(db, 1, new Date('2026-01-01T21:30:00.000Z'));
    expect(result.sessions[0]?.date).toBe('2026-01-02');
    expect(result.trend).toEqual([{ date: '2026-01-02', e1rmKilograms: 100 }]);
    expect(result.latest).toBe(100);
  });

  it('returns empty data for an exercise with no sets or a missing exercise', () => {
    const empty = { sessions: [], trend: [], latest: null, changePerWeekPercent: null };
    expect(ExerciseStrength.series(db, 1, now)).toEqual(empty);
    expect(ExerciseStrength.series(db, 999, now)).toEqual(empty);
  });

  it('reproduces the report bench example through SQLite, retaining original kg and RPE', () => {
    const workoutId = workout('2026-01-01T10:00:00.000Z');
    addSet(entry(workoutId), { entryUnit: 'lb' });
    const estimate = 100 * (1 + 6 / 29);
    expect(ExerciseStrength.series(db, 1, now)).toEqual({
      sessions: [
        {
          workoutId,
          date: '2026-01-01',
          e1rmKilograms: estimate,
          bestSet: { weightKilograms: 100, reps: 5, rpe: 8 },
        },
      ],
      trend: [{ date: '2026-01-01', e1rmKilograms: estimate }],
      latest: estimate,
      changePerWeekPercent: null,
    });
  });

  it('takes the maximum e1RM, rather than heaviest load or average, across repeated entries', () => {
    const workoutId = workout('2026-01-01T10:00:00.000Z');
    const first = entry(workoutId);
    addSet(first, { weightKilograms: 105, reps: 1, rpe: 10 });
    addSet(first, { weightKilograms: 100, reps: 5, rpe: 10 });
    addSet(entry(workoutId, 1, 1));
    const result = ExerciseStrength.series(db, 1, now);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.bestSet).toEqual({ weightKilograms: 100, reps: 5, rpe: 8 });
  });

  it('takes one maximum per local day across workouts and keeps the first set on ties (zone pinned to UTC)', () => {
    vi.stubEnv('TZ', 'UTC');
    const firstWorkout = workout('2026-01-01T01:00:00.000Z');
    const secondWorkout = workout('2026-01-01T22:00:00.000Z');
    const thirdWorkout = workout('2026-01-02T01:00:00.000Z');
    addSet(entry(firstWorkout), { reps: 1, rpe: 10 });
    const secondEntry = entry(secondWorkout);
    addSet(secondEntry);
    addSet(secondEntry, { rpe: null });
    addSet(entry(thirdWorkout));
    const sessions = ExerciseStrength.series(db, 1, now).sessions;
    expect(sessions.map((session) => session.workoutId)).toEqual([secondWorkout, thirdWorkout]);
    expect(sessions.map((session) => session.date)).toEqual(['2026-01-01', '2026-01-02']);
    expect(sessions[0]?.bestSet.rpe).toBe(8);
  });

  it('skips warm-ups, planned sets, active/future workouts, other exercises and nonqualifying days', () => {
    const first = entry(workout('2026-01-01T10:00:00.000Z'));
    addSet(first, { kind: 'warmup' });
    addSet(first, { isCompleted: false });
    addSet(first, { reps: 11 });
    addSet(first, { rpe: 5 });
    addSet(first, { reps: 0 });
    addSet(first, { weightKilograms: 0 });
    addSet(entry(workout('2026-01-02T10:00:00.000Z', true)));
    addSet(entry(workout('2026-02-01T10:00:00.000Z')));
    addSet(entry(workout('2026-01-03T10:00:00.000Z'), 2));
    expect(ExerciseStrength.series(db, 1, now).sessions).toEqual([]);
  });

  it('retains unknown RPE and treats failure as RIR 0', () => {
    addSet(entry(workout('2026-01-01T10:00:00.000Z')), { rpe: null });
    addSet(entry(workout('2026-01-08T10:00:00.000Z')), { kind: 'failure', rpe: null });
    const sessions = ExerciseStrength.series(db, 1, now).sessions;
    expect(sessions[0]?.e1rmKilograms).toBe(100 * (1 + 6 / 29));
    expect(sessions[1]?.e1rmKilograms).toBe(100 * (1 + 4 / 29));
    expect(sessions.map((session) => session.bestSet.rpe)).toEqual([null, null]);
  });

  it('sorts history chronologically and carries the winning set effort weight into EWMA', () => {
    addSet(entry(workout('2026-01-08T10:00:00.000Z')), { weightKilograms: 110, rpe: null });
    addSet(entry(workout('2026-01-01T10:00:00.000Z')));
    const result = ExerciseStrength.series(db, 1, new Date('2026-01-15'));
    const first = 100 * (1 + 6 / 29);
    const last = 110 * (1 + 6 / 29);
    const expected = first + 0.5 * (1 - Math.exp(-7 / 21)) * (last - first);
    expect(result.sessions.map((session) => session.date)).toEqual(['2026-01-01', '2026-01-08']);
    expect(result.latest).toBeCloseTo(expected, 12);
    expect(result.changePerWeekPercent).toBeCloseTo((expected / first - 1) * 100, 12);
    expect(ExerciseStrength.series(db, 1, new Date('2026-01-04')).sessions).toHaveLength(1);
  });

  it('retains an outlier in raw sessions while holding the trend in both directions', () => {
    addSet(entry(workout('2026-01-01T10:00:00.000Z')));
    addSet(entry(workout('2026-01-08T10:00:00.000Z')), { weightKilograms: 200 });
    addSet(entry(workout('2026-01-15T10:00:00.000Z')), { weightKilograms: 50 });
    const result = ExerciseStrength.series(db, 1, now);
    expect(result.sessions).toHaveLength(3);
    expect(result.sessions[1]?.e1rmKilograms).toBe(200 * (1 + 6 / 29));
    expect(result.trend.map((point) => point.e1rmKilograms)).toEqual(Array(3).fill(100 * (1 + 6 / 29)));
    expect(result.changePerWeekPercent).toBeNull();
  });

  it('does not invent a k for unmatched imports or total mass for bodyweight tracking', () => {
    addSet(entry(workout('2026-01-01T10:00:00.000Z')));
    db.run('UPDATE exercise SET mechanic = NULL WHERE id = 1');
    expect(ExerciseStrength.series(db, 1, now).latest).toBeNull();
    db.run("UPDATE exercise SET mechanic = 'compound', tracking = 'bodyweight-reps' WHERE id = 1");
    expect(ExerciseStrength.series(db, 1, now).latest).toBeNull();
  });
});
