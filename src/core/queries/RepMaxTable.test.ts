import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { RepMaxTable } from './RepMaxTable';

let db: Database;
beforeEach(async () => {
  db = await Database.openInMemory();
  migrate(db);
  db.exec(`
    INSERT INTO exercise (id, name, equipment, movementPattern, mechanic, source, createdAt)
    VALUES (1, 'Synthetic press', 'barbell', 'horizontal-push', 'compound', 'custom', '2026-01-01');
  `);
});
afterEach(() => db.close());

function add(date: string, weight: number, reps: number, rpe: number | null = 10, kind = 'working'): void {
  const workout = db.run(`INSERT INTO workout (startedAt, name, source) VALUES (?, 'Synthetic', 'app')`, [
    date,
  ]).lastInsertRowId;
  const entry = db.run(`INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, 1, 0)`, [
    workout,
  ]).lastInsertRowId;
  db.run(
    `
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, reps, rpe, entryUnit)
    VALUES (?, 0, ?, ?, ?, ?, 'kg')
  `,
    [entry, kind, weight, reps, rpe],
  );
}

describe('RepMaxTable', () => {
  it('returns 12 absent rows for empty weight history and no rows for a missing exercise', () => {
    const records = RepMaxTable(db, 1);
    expect(records.repMax).toHaveLength(12);
    expect(records.repMax.every((row) => row.best === null && row.predictedKilograms === null)).toBe(true);
    expect(records.estimatedOneRepMax).toBeNull();
    expect(records.heaviestWeight).toBeNull();
    expect(records.sessionVolume).toBeNull();
    expect(RepMaxTable(db, 999).repMax).toEqual([]);
  });

  it('selects heaviest sets with at least the target reps and computes predictions by hand (k=29, RIR 0)', () => {
    add('2026-01-01', 87, 5); // e1RM = 87 × 33/29 = 99.
    add('2026-01-02', 58, 8); // e1RM = 72; larger session volume = 464.
    add('2026-01-03', 99, 1); // Tie e1RM keeps Jan 1; heaviest actual = 99.
    add('2026-01-04', 500, 12, 10, 'warmup');
    const records = RepMaxTable(db, 1);
    expect(records.repMax.map((row) => row.best?.value ?? null)).toEqual([
      99,
      87,
      87,
      87,
      87,
      58,
      58,
      58,
      null,
      null,
      null,
      null,
    ]);
    expect(records.repMax.map((row) => row.reps)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(records.repMax[0]?.predictedKilograms).toBe(99);
    expect(records.repMax[4]?.predictedKilograms).toBeCloseTo(87, 12);
    expect(records.repMax[11]?.predictedKilograms).toBeCloseTo(71.775, 12);
    expect(records.estimatedOneRepMax?.date).toBe('2026-01-01');
    expect(records.heaviestWeight?.set.reps).toBe(1);
    expect(records.heaviestWeight?.set.rpe).toBe(10);
    expect(records.sessionVolume?.value).toBe(464);
    expect(records.sessionVolume?.date).toBe('2026-01-02');
  });

  it('applies the canonical effort rules for unknown RPE and failure', () => {
    add('2026-01-01', 87, 5, null); // Unknown RIR 2: 87 × 35/29 = 105.
    add('2026-01-02', 87, 5, null, 'failure'); // Failure RIR 0: 99.
    expect(RepMaxTable(db, 1).estimatedOneRepMax?.value).toBe(105);
    expect(RepMaxTable(db, 1).repMax[0]?.predictedKilograms).toBe(105);
  });

  it('keeps actual performance without making predictions for unclassified or ineligible sets', () => {
    add('2026-01-01', 58, 15);
    expect(RepMaxTable(db, 1).repMax[11]?.best?.value).toBe(58);
    expect(RepMaxTable(db, 1).repMax[11]?.predictedKilograms).toBeNull();
    db.exec('UPDATE exercise SET mechanic = NULL WHERE id = 1');
    add('2026-01-02', 87, 5);
    expect(RepMaxTable(db, 1).repMax[0]?.best?.value).toBe(87);
    expect(RepMaxTable(db, 1).repMax[0]?.predictedKilograms).toBeNull();
  });

  it.each(['bodyweight-reps', 'duration', 'weight-duration'])('does not predict rep-max weights for %s', (tracking) => {
    add('2026-01-01', 87, 5);
    db.run('UPDATE exercise SET tracking = ? WHERE id = 1', [tracking]);
    const records = RepMaxTable(db, 1);
    expect(records.repMax).toEqual([]);
    expect(records.estimatedOneRepMax).toBeNull();
    expect(records.sessionVolume).toBeNull();
    expect(records.heaviestWeight?.value ?? null).toBe(tracking === 'weight-duration' ? 87 : null);
  });
});
