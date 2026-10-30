import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import type { SetKind } from '../models/SetKind';
import { liveSetFinding } from './LiveSetCheck';

const now = new Date('2026-02-01T10:00:00.000Z');
function insertSession(db: Database, id: number, weight: number, reps = 8, inProgress = false, completed = true) {
  db.run(`INSERT INTO workout (id, startedAt, name, source, isInProgress) VALUES (?, ?, 'Legs', 'app', ?)`, [
    id,
    `2026-01-${String(id).padStart(2, '0')} 10:00:00`,
    inProgress ? 1 : 0,
  ]);
  db.run('INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (?, ?, 1, 0)', [id, id]);
  db.run(
    `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted) VALUES (?, 0, 'working', ?, 'kg', ?, ?)`,
    [id, weight, reps, completed ? 1 : 0],
  );
}
async function fixture(weights = [100, 100, 100, 100]) {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Squat (Barbell)', 'custom', '2026-01-01');`);
  weights.forEach((weight, index) => insertSession(db, index + 1, weight));
  return db;
}
function check(db: Database, weight: number, reps: number, kind: SetKind = 'working', excluding: number | null = null) {
  return liveSetFinding(db, 1, weight, reps, kind, excluding, now);
}
describe('Live typo check', () => {
  test('A normal set is not flagged', async () => expect(check(await fixture(), 105, 8)).toBeUndefined());
  test('An extra zero is flagged as too high with decimal shift suggested', async () =>
    expect(check(await fixture(), 1000, 8)).toMatchObject({ issue: 'weightTooHigh', typical: 100, suggestion: 100 }));
  test('A missed digit is flagged as too low', async () =>
    expect(check(await fixture(), 10, 8)).toMatchObject({ issue: 'weightTooLow', suggestion: 100 }));
  test('A weight typed in pounds suggests the kilogram value', async () => {
    const result = check(await fixture(), 220.462, 8);
    expect(result?.issue).toBe('weightTooHigh');
    expect(result?.suggestion).toBeCloseTo(100, 2);
  });
  test('80 reps where 8 is typical is flagged and 8 suggested', async () =>
    expect(check(await fixture(), 100, 80)).toMatchObject({ issue: 'repsTooHigh', typical: 8, suggestion: 8 }));
  test('Fewer than three past sessions is not enough to judge', async () =>
    expect(check(await fixture([100, 100]), 1000, 80)).toBeUndefined());
  test('Warm-ups are never flagged', async () => expect(check(await fixture(), 1000, 80, 'warmup')).toBeUndefined());
  test('A working set of zero reps is reported even without history', async () =>
    expect(check(await fixture([]), 100, 0)?.issue).toBe('zeroReps'));
  test('The workout in progress and planned sets are not history', async () => {
    const db = await fixture([100, 100]);
    insertSession(db, 3, 100, 8, true);
    insertSession(db, 4, 100, 8, false, false);
    expect(check(db, 1000, 8)).toBeUndefined();
  });
  test('excludingWorkout leaves that workout out of history', async () => {
    const db = await fixture([100, 100, 100]);
    expect(check(db, 1000, 8)?.issue).toBe('weightTooHigh');
    expect(check(db, 1000, 8, 'working', 3)).toBeUndefined();
  });
  test('Only the newest four sessions set what is typical', async () => {
    const db = await fixture([40, 40, 40, 100, 100, 100, 100]);
    expect(check(db, 105, 8)).toBeUndefined();
    expect(check(db, 30, 8)?.issue).toBe('weightTooLow');
  });
});
