import { afterEach, describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import type { WorkoutSetRow } from '../models/WorkoutSet';
import { WorkoutLogger } from './WorkoutLogger';

const connections: Database[] = [];
const now = new Date('2026-10-31T10:00:00Z');

async function fixture(count: number | null = null) {
  const db = await Database.openInMemory();
  connections.push(db);
  migrate(db);
  db.run(
    `
    INSERT INTO exercise (id, name, source, equipment, mechanic, movementPattern, warmupSetCount, createdAt)
    VALUES (1, 'Synthetic bench', 'custom', 'barbell', 'compound', 'horizontal-push', ?, '2026-01-01')
  `,
    [count],
  );
  return { db, logger: new WorkoutLogger(db) };
}

function rows(db: Database, entryId: number): WorkoutSetRow[] {
  return db.all<WorkoutSetRow>('SELECT * FROM workoutSet WHERE workoutExerciseId = ? ORDER BY position', [entryId]);
}

function firstWork(db: Database, entryId: number): WorkoutSetRow {
  const set = rows(db, entryId).find((set) => set.kind !== 'warmup');
  if (set === undefined) throw new Error('Expected a work set');
  return set;
}

function typeWork(logger: WorkoutLogger, db: Database, entryId: number, weight: number) {
  const set = firstWork(db, entryId);
  logger.updateSet(set.id, weight, 'kg', 8, null, 'working');
}

function seedHistory(db: Database) {
  db.exec(`
    INSERT INTO workout (id, name, startedAt, endedAt, source) VALUES (1, 'Past', '2026-01-01', '2026-01-01', 'app');
    INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0);
    INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted)
    VALUES (1, 0, 'warmup', 25, 'kg', 10, 1), (1, 1, 'working', 100, 'kg', 8, 1);
  `);
}

afterEach(() => {
  for (const db of connections.splice(0)) db.close();
});

describe('generated warm-ups in the logger', () => {
  test('typing the first work load creates planned warm-ups before work, and ticking keeps shown values', async () => {
    const { db, logger } = await fixture();
    const entry = logger.addExercise(1, logger.start('Push', now));
    expect(rows(db, entry)).toHaveLength(1);
    typeWork(logger, db, entry, 100);
    const sets = rows(db, entry);
    expect(sets.map((set) => [set.kind, set.weightKilograms, set.reps])).toEqual([
      ['warmup', 40, 8],
      ['warmup', 60, 5],
      ['warmup', 80, 2],
      ['working', 100, 8],
    ]);
    expect(sets.map((set) => set.position)).toEqual([0, 1, 2, 3]);
    expect(logger.suggestedWarmupSetIds(entry)).toEqual(sets.slice(0, 3).map((set) => set.id));
    const first = sets[0];
    if (first === undefined) throw new Error('Expected warm-up');
    logger.setCompleted(first.id, true, now);
    expect(rows(db, entry)[0]).toMatchObject({ weightKilograms: 40, reps: 8, isCompleted: 1 });
    expect(logger.suggestedWarmupSetIds(entry)).not.toContain(first.id);
  });

  test('adding from history replaces old warm-up prefill with the computed plan and leaves history intact', async () => {
    const { db, logger } = await fixture();
    seedHistory(db);
    const before = rows(db, 1);
    const entry = logger.addExercise(1, logger.start('Push', now));
    expect(rows(db, entry).map((set) => set.weightKilograms)).toEqual([40, 60, 80, 100]);
    expect(rows(db, 1)).toEqual(before);
    expect(rows(db, entry).every((set) => set.isCompleted === 0)).toBe(true);
  });

  test('template start generates from the history-matched first working weight, without duplicate template warm-ups', async () => {
    const { db, logger } = await fixture();
    seedHistory(db);
    db.exec(`
      INSERT INTO template (id, name, position, createdAt, updatedAt) VALUES (1, 'Plan', 0, 'a', 'a');
      INSERT INTO templateExercise (id, templateId, exerciseId, position) VALUES (1, 1, 1, 0);
      INSERT INTO templateSet (templateExerciseId, position, kind) VALUES (1, 0, 'warmup'), (1, 1, 'working');
    `);
    const workout = logger.startFromTemplate(1, now);
    const entry = db.value<number>('SELECT id FROM workoutExercise WHERE workoutId = ?', [workout]) ?? -1;
    expect(rows(db, entry).map((set) => [set.kind, set.weightKilograms])).toEqual([
      ['warmup', 40],
      ['warmup', 60],
      ['warmup', 80],
      ['working', 100],
    ]);
  });

  test('refresh preserves every completed field and manually changed weight/reps, refreshing only untouched slots', async () => {
    const { db, logger } = await fixture();
    const entry = logger.addExercise(1, logger.start('Push', now));
    typeWork(logger, db, entry, 100);
    const [first, second] = rows(db, entry);
    if (first === undefined || second === undefined) throw new Error('Expected warm-ups');
    logger.setCompleted(first.id, true, now);
    logger.updateSet(second.id, 62, 'kg', 7, 6, 'warmup');
    const protectedRows = rows(db, entry).slice(0, 2);
    typeWork(logger, db, entry, 120);
    expect(rows(db, entry).slice(0, 2)).toEqual(protectedRows);
    expect(rows(db, entry)[2]).toMatchObject({ weightKilograms: 95, reps: 2, isCompleted: 0 });
    expect(logger.suggestedWarmupSetIds(entry)).toEqual([rows(db, entry)[2]?.id]);
    // Returning an edited row to its old numbers must not make it automatic again.
    logger.updateSet(second.id, 60, 'kg', 5, null, 'warmup');
    typeWork(logger, db, entry, 130);
    expect(rows(db, entry)[1]).toMatchObject({ weightKilograms: 60, reps: 5 });
  });

  test('a reps-only edit also protects a suggestion', async () => {
    const { db, logger } = await fixture();
    const entry = logger.addExercise(1, logger.start('Push', now));
    typeWork(logger, db, entry, 100);
    const first = rows(db, entry)[0];
    if (first === undefined) throw new Error('Expected warm-up');
    logger.updateSet(first.id, first.weightKilograms, 'kg', 12, null, 'warmup');
    typeWork(logger, db, entry, 120);
    expect(rows(db, entry)[0]).toMatchObject({ weightKilograms: 40, reps: 12 });
  });

  test('deleting every warm-up suppresses regeneration only for this workout entry', async () => {
    const { db, logger } = await fixture();
    const workout = logger.start('Push', now);
    const entry = logger.addExercise(1, workout);
    typeWork(logger, db, entry, 100);
    for (const set of rows(db, entry).filter((set) => set.kind === 'warmup')) logger.deleteSet(set.id);
    typeWork(logger, db, entry, 120);
    expect(rows(db, entry)).toHaveLength(1);
    const other = logger.addExercise(1, workout);
    typeWork(logger, db, other, 100);
    expect(rows(db, other)).toHaveLength(4);
  });

  test('count zero removes inherited warm-ups and generates none when typing', async () => {
    const { db, logger } = await fixture(0);
    seedHistory(db);
    const entry = logger.addExercise(1, logger.start('Push', now));
    typeWork(logger, db, entry, 100);
    expect(rows(db, entry).map((set) => set.kind)).toEqual(['working']);
  });

  test('a lower first weight drops obsolete suggestions while keeping completed warm-ups', async () => {
    const { db, logger } = await fixture();
    const entry = logger.addExercise(1, logger.start('Push', now));
    typeWork(logger, db, entry, 100);
    const first = rows(db, entry)[0];
    if (first === undefined) throw new Error('Expected warm-up');
    logger.setCompleted(first.id, true, now);
    typeWork(logger, db, entry, 20);
    expect(rows(db, entry).map((set) => set.weightKilograms)).toEqual([40, 20]);
    expect(rows(db, entry).map((set) => set.position)).toEqual([0, 1]);
  });

  test('after reopening, existing warm-ups and deletions are preserved; an empty new entry can still generate', async () => {
    const { db, logger } = await fixture();
    const workout = logger.start('Push', now);
    const first = logger.addExercise(1, workout);
    typeWork(logger, db, first, 100);
    const stored = rows(db, first).filter((set) => set.kind === 'warmup');
    const deleted = logger.addExercise(1, workout);
    typeWork(logger, db, deleted, 100);
    for (const set of rows(db, deleted).filter((set) => set.kind === 'warmup')) logger.deleteSet(set.id);
    const empty = logger.addExercise(1, workout);
    const resumed = new WorkoutLogger(db);
    typeWork(resumed, db, first, 120);
    expect(rows(db, first).filter((set) => set.kind === 'warmup')).toEqual(stored);
    typeWork(resumed, db, deleted, 120);
    expect(rows(db, deleted)).toHaveLength(1);
    typeWork(resumed, db, empty, 100);
    expect(rows(db, empty)).toHaveLength(4);
  });

  test('changing a finished work set never generates warm-ups in history', async () => {
    const { db, logger } = await fixture();
    seedHistory(db);
    typeWork(logger, db, 1, 120);
    expect(rows(db, 1)).toHaveLength(2);
  });
});
