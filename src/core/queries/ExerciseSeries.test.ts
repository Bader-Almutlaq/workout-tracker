import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import type { WorkoutSet } from '../models/WorkoutSet';
import { toKilograms } from '../units/Weight';
import { ExerciseSeries } from './ExerciseSeries';

let db: Database;
const now = new Date('2026-02-01');
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, equipment, movementPattern, mechanic, source, createdAt)
    VALUES (1, 'Synthetic press', 'barbell', 'horizontal-push', 'compound', 'custom', '2026-01-01');
  `);
});
afterEach(() => db.close());

function session(date: string, active = false): number {
  return db.run(
    `
    INSERT INTO workout (startedAt, name, source, isInProgress)
    VALUES (?, 'Synthetic session', 'app', ?)
  `,
    [date, active ? 1 : 0],
  ).lastInsertRowId;
}

function add(
  workoutId: number,
  changes: Partial<
    Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps' | 'entryUnit' | 'rpe' | 'durationSeconds' | 'isCompleted'>
  > = {},
  position = 0,
): void {
  const entryId = db.run(
    `
    INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, 1, ?)
  `,
    [workoutId, position],
  ).lastInsertRowId;
  const set = {
    kind: 'working',
    weightKilograms: 87,
    reps: 5,
    entryUnit: 'kg',
    rpe: 10,
    durationSeconds: null,
    isCompleted: true,
    ...changes,
  };
  db.run(
    `
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, entryUnit, rpe, durationSeconds, isCompleted)
    VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      entryId,
      set.kind,
      set.weightKilograms,
      set.reps,
      set.entryUnit,
      set.rpe,
      set.durationSeconds,
      set.isCompleted ? 1 : 0,
    ],
  );
}

describe('ExerciseSeries', () => {
  it('returns empty series and History for empty or missing exercises', () => {
    for (const id of [1, 999]) {
      const history = ExerciseSeries.read(db, id, now);
      for (const query of [
        ExerciseSeries.estimatedOneRepMax,
        ExerciseSeries.heaviestWeight,
        ExerciseSeries.sessionVolume,
        ExerciseSeries.bestReps,
        ExerciseSeries.progression,
        ExerciseSeries.duration,
      ])
        expect(query(history)).toEqual([]);
      expect(ExerciseSeries.history(db, id, 0, now)).toEqual([]);
    }
  });

  it('keeps separate same-day sessions, groups repeated entries, and excludes warm-ups/plans/live/future sessions from analytics', () => {
    const first = session('2026-01-01T09:00:00.000Z');
    add(first);
    add(first, { kind: 'drop', weightKilograms: 58, reps: 8 }, 1);
    add(first, { kind: 'warmup', weightKilograms: 290, reps: 12 }, 2);
    add(first, { isCompleted: false, weightKilograms: 500 }, 3);
    const second = session('2026-01-01T18:00:00.000Z');
    add(second, { kind: 'failure', weightKilograms: 116, reps: 1, rpe: null });
    add(session('2026-01-03'), { weightKilograms: 58 });
    add(session('2026-01-04', true), { weightKilograms: 500 });
    add(session('2027-01-01'), { weightKilograms: 500 });
    const history = ExerciseSeries.read(db, 1, now);
    // 87 × (1 + 4/29) = 99; 58 × (1 + 7/29) = 72; true single = 116.
    expect(ExerciseSeries.estimatedOneRepMax(history).map((point) => point.value)).toEqual([99, 116, 66]);
    expect(ExerciseSeries.heaviestWeight(history).map((point) => point.value)).toEqual([87, 116, 58]);
    expect(ExerciseSeries.sessionVolume(history).map((point) => point.value)).toEqual([899, 116, 290]);
    expect(ExerciseSeries.bestReps(history).map((point) => point.value)).toEqual([8, 1, 5]);
    expect(ExerciseSeries.progression(history).map((point) => point.value)).toEqual([99, 116, 116]);
    expect(history.sessions.map((item) => item.workoutId).slice(0, 2)).toEqual([first, second]);
    const page = ExerciseSeries.history(db, 1, 0, now);
    expect(page.at(-1)?.sets.map((set) => set.kind)).toEqual(['working', 'drop', 'warmup']);
    expect(page.at(-1)?.name).toBe('Synthetic session');
  });

  it('uses canonical kg equally for kg and lb entries in every weighted series', () => {
    const kg = toKilograms(192, 'lb');
    add(session('2026-01-01'), { weightKilograms: kg, entryUnit: 'kg' });
    add(session('2026-01-02'), { weightKilograms: kg, entryUnit: 'lb' });
    const history = ExerciseSeries.read(db, 1, now);
    for (const query of [
      ExerciseSeries.estimatedOneRepMax,
      ExerciseSeries.heaviestWeight,
      ExerciseSeries.sessionVolume,
      ExerciseSeries.bestReps,
      ExerciseSeries.progression,
    ]) {
      const values = query(history).map((point) => point.value);
      expect(values).toHaveLength(2);
      expect(values[0]).toBe(values[1]);
    }
  });

  it('shows bodyweight reps without inventing total load, volume or strength', () => {
    db.exec("UPDATE exercise SET tracking = 'bodyweight-reps' WHERE id = 1");
    add(session('2026-01-01'), { weightKilograms: 0, reps: 14 });
    const history = ExerciseSeries.read(db, 1, now);
    expect(ExerciseSeries.bestReps(history)[0]?.value).toBe(14);
    for (const query of [
      ExerciseSeries.estimatedOneRepMax,
      ExerciseSeries.heaviestWeight,
      ExerciseSeries.sessionVolume,
      ExerciseSeries.progression,
      ExerciseSeries.duration,
    ])
      expect(query(history)).toEqual([]);
  });

  it.each(['duration', 'weight-duration'])(
    'uses seconds for %s; only loaded duration also has a weight series',
    (tracking) => {
      db.run('UPDATE exercise SET tracking = ? WHERE id = 1', [tracking]);
      const workout = session('2026-01-01');
      add(workout, { durationSeconds: 42 });
      add(workout, { durationSeconds: 68, kind: 'drop' }, 1);
      add(workout, { durationSeconds: 500, kind: 'warmup' }, 2);
      const history = ExerciseSeries.read(db, 1, now);
      expect(ExerciseSeries.duration(history)[0]?.value).toBe(68);
      expect(ExerciseSeries.heaviestWeight(history)).toHaveLength(tracking === 'duration' ? 0 : 1);
      for (const query of [
        ExerciseSeries.estimatedOneRepMax,
        ExerciseSeries.sessionVolume,
        ExerciseSeries.bestReps,
        ExerciseSeries.progression,
      ])
        expect(query(history)).toEqual([]);
    },
  );

  it('paginates sessions with deterministic ID ties, keeping repeated entries together', () => {
    for (let index = 0; index < 201; index += 1) session('2026-01-01');
    const newest = db.value<number>('SELECT MAX(id) FROM workout') ?? 0;
    add(newest);
    add(newest, { kind: 'warmup' }, 1);
    const first = ExerciseSeries.history(db, 1, 0, now);
    // Sessions without this exercise do not consume page slots.
    expect(first).toHaveLength(1);
    for (let id = 1; id < newest; id += 1) add(id);
    const page = ExerciseSeries.history(db, 1, 0, now);
    const next = ExerciseSeries.history(db, 1, 200, now);
    expect(page).toHaveLength(200);
    expect(page[0]?.sets).toHaveLength(2);
    expect(next.map((item) => item.workoutId)).toEqual([1]);
    expect(new Set([...page, ...next].map((item) => item.workoutId)).size).toBe(201);
  });
});
