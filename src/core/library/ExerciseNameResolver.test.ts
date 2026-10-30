import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { exerciseIdNamed } from './ExerciseNameResolver';

async function databaseWithExercises(): Promise<{ db: Database; benchId: number; rowId: number }> {
  const db = await Database.openInMemory();
  migrate(db);
  const createdAt = '2026-10-30T10:00:00.000Z';
  const benchId = db.run(
    "INSERT INTO exercise (name, source, createdAt) VALUES ('Bench Press (Barbell)', 'library', ?)",
    [createdAt],
  ).lastInsertRowId;
  const rowId = db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('Row (Cable)', 'library', ?)", [
    createdAt,
  ]).lastInsertRowId;
  db.run("INSERT INTO exerciseAlias (alias, exerciseId) VALUES ('Seated Row', ?)", [rowId]);
  return { db, benchId, rowId };
}

describe('Exercise name resolution', () => {
  test('An exact name finds its exercise, ignoring case', async () => {
    const { db, benchId } = await databaseWithExercises();
    expect(exerciseIdNamed(db, 'Bench Press (Barbell)')).toBe(benchId);
    expect(exerciseIdNamed(db, 'BENCH press (barbell)')).toBe(benchId);
  });

  test('A saved alias finds its exercise, ignoring case', async () => {
    const { db, rowId } = await databaseWithExercises();
    expect(exerciseIdNamed(db, 'Seated Row')).toBe(rowId);
    expect(exerciseIdNamed(db, 'seated row')).toBe(rowId);
  });

  test('The exercise name wins over an alias with the same text', async () => {
    const { db, benchId, rowId } = await databaseWithExercises();
    db.run("INSERT INTO exerciseAlias (alias, exerciseId) VALUES ('Bench Press (Barbell) ', ?)", [rowId]);
    expect(exerciseIdNamed(db, 'Bench Press (Barbell)')).toBe(benchId);
  });

  test('An unknown name finds nothing', async () => {
    const { db } = await databaseWithExercises();
    expect(exerciseIdNamed(db, 'Bayesian Cable Curl')).toBeUndefined();
  });
});
