import { describe, expect, test, vi } from 'vitest';
import { Database } from '../db/Database';
import { DatabaseError } from '../db/DatabaseError';
import { migrate } from '../db/migrations';
import { NEWER_LAYOUT, OLDER_LAYOUT, WAIST } from './fixtures/StrongFixtures';
import { makeStrongImportPlan, type StrongImportPlan } from './StrongImportPlan';
import { importStrongPlan } from './StrongImporter';
import { parseStrongMeasurementsFile } from './StrongMeasurementsFile';
import { parseStrongWorkoutsFile } from './StrongWorkoutsFile';

vi.stubEnv('TZ', 'UTC');

const NOW = new Date('2026-10-30T12:00:00.000Z');

async function migratedDatabase(): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db);
  return db;
}

function plan(): StrongImportPlan {
  return makeStrongImportPlan(parseStrongWorkoutsFile(OLDER_LAYOUT), parseStrongMeasurementsFile(WAIST));
}

function count(db: Database, table: string): number {
  return db.value<number>(`SELECT count(*) FROM ${table}`) ?? -1;
}

describe('Importing into the database', () => {
  test('Everything in the plan is stored', async () => {
    const db = await migratedDatabase();
    const result = importStrongPlan(db, plan(), NOW);
    expect(result).toEqual({ workoutsAdded: 2, workoutsSkipped: 0, setsAdded: 6, exercisesCreated: 2, measurementsAdded: 2 });

    expect(count(db, 'workoutSet')).toBe(6);
    const curl = db.get<{ defaultEntryUnit: string; source: string; createdAt: string }>(
      "SELECT defaultEntryUnit, source, createdAt FROM exercise WHERE name = 'Seated Leg Curl (Machine)'",
    );
    expect(curl).toEqual({ defaultEntryUnit: 'lb', source: 'strong', createdAt: NOW.toISOString() });
  });

  test('Importing the same file twice adds nothing', async () => {
    const db = await migratedDatabase();
    importStrongPlan(db, plan(), NOW);
    const second = importStrongPlan(db, plan(), NOW);
    expect(second).toEqual({ workoutsAdded: 0, workoutsSkipped: 2, setsAdded: 0, exercisesCreated: 0, measurementsAdded: 0 });
    expect(count(db, 'workout')).toBe(2);
    expect(count(db, 'workoutSet')).toBe(6);
    expect(count(db, 'bodyMeasurement')).toBe(2);
  });

  test('Existing exercises are reused, matched case-insensitively', async () => {
    const db = await migratedDatabase();
    db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('bench press (barbell)', 'custom', ?)", [NOW.toISOString()]);
    const result = importStrongPlan(db, plan(), NOW);
    expect(result.exercisesCreated).toBe(1);
    expect(count(db, 'exercise')).toBe(2);
  });
});

describe('Importing details beyond the native tests', () => {
  test('A saved alias resolves to its exercise', async () => {
    const db = await migratedDatabase();
    const id = db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('Bench Press', 'library', ?)", [NOW.toISOString()])
      .lastInsertRowId;
    db.run("INSERT INTO exerciseAlias (alias, exerciseId) VALUES ('Bench Press (Barbell)', ?)", [id]);
    const result = importStrongPlan(db, plan(), NOW);
    expect(result.exercisesCreated).toBe(1);
    expect(db.value<number>('SELECT count(*) FROM workoutExercise WHERE exerciseId = ?', [id])).toBe(1);
  });

  test('An existing exercise without history adopts the unit Strong uses; one with history keeps its own', async () => {
    const db = await migratedDatabase();
    db.run("INSERT INTO exercise (name, source, createdAt) VALUES ('Seated Leg Curl (Machine)', 'library', ?)", [NOW.toISOString()]);
    importStrongPlan(db, plan(), NOW);
    expect(db.value<string>("SELECT defaultEntryUnit FROM exercise WHERE name = 'Seated Leg Curl (Machine)'")).toBe('lb');

    db.run("UPDATE exercise SET defaultEntryUnit = 'kg' WHERE name = 'Seated Leg Curl (Machine)'");
    db.run('DELETE FROM workout WHERE sourceKey = ?', ['strong:2024-01-08 10:00:00']);
    importStrongPlan(db, plan(), NOW);
    // The first workout (with curl history) was skipped as already imported; the exercise has history, so its unit stays.
    expect(db.value<string>("SELECT defaultEntryUnit FROM exercise WHERE name = 'Seated Leg Curl (Machine)'")).toBe('kg');
  });

  test('Stored rows carry the planned values', async () => {
    const db = await migratedDatabase();
    importStrongPlan(db, plan(), NOW);
    const workout = db.get('SELECT startedAt, endedAt, name, notes, source, sourceKey, isInProgress FROM workout ORDER BY startedAt');
    expect(workout).toEqual({
      startedAt: '2024-01-01T10:00:00.000Z',
      endedAt: '2024-01-01T11:07:00.000Z',
      name: 'Push, heavy',
      notes: 'Felt good',
      source: 'strong',
      sourceKey: 'strong:2024-01-01 10:00:00',
      isInProgress: 0,
    });
    const set = db.get(
      `SELECT s.position, s.kind, s.weightKilograms, s.entryUnit, s.reps, s.rpe, s.isCompleted, s.side
       FROM workoutSet s JOIN workoutExercise e ON e.id = s.workoutExerciseId JOIN exercise x ON x.id = e.exerciseId
       WHERE x.name = 'Bench Press (Barbell)' AND s.position = 1`,
    );
    expect(set).toEqual({ position: 1, kind: 'working', weightKilograms: 61.23, entryUnit: 'lb', reps: 8, rpe: 8, isCompleted: 1, side: 'both' });
    expect(db.get('SELECT takenAt, site, value, source FROM bodyMeasurement ORDER BY takenAt LIMIT 1')).toMatchObject({
      site: 'waist',
      source: 'strong',
    });
  });

  test('Exercise notes are stored on the workout exercise', async () => {
    const db = await migratedDatabase();
    importStrongPlan(db, makeStrongImportPlan(parseStrongWorkoutsFile(NEWER_LAYOUT)), NOW);
    expect(db.value<string>('SELECT notes FROM workoutExercise')).toBe('Use the wide bar');
    expect(db.value<number>('SELECT rpe FROM workoutSet WHERE position = 0')).toBe(8.5);
  });

  test('A measurement already present is skipped', async () => {
    const db = await migratedDatabase();
    importStrongPlan(db, plan(), NOW);
    db.run('DELETE FROM workout');
    const again = importStrongPlan(db, plan(), NOW);
    expect(again.measurementsAdded).toBe(0);
    expect(again.workoutsAdded).toBe(2);
  });

  test('A failure rolls back everything: nothing is half-imported', async () => {
    const db = await migratedDatabase();
    const good = plan();
    const lastWorkout = good.workouts[good.workouts.length - 1];
    const lastExercise = lastWorkout?.exercises[0];
    const lastSet = lastExercise?.sets[0];
    if (lastWorkout === undefined || lastExercise === undefined || lastSet === undefined) throw new Error('Fixture changed');
    // Two sets at the same position break the schema's unique index, after the first workout was already written.
    const clashing = { ...lastExercise, sets: [lastSet, lastSet] };
    const broken: StrongImportPlan = {
      ...good,
      workouts: [...good.workouts.slice(0, -1), { ...lastWorkout, exercises: [clashing] }],
    };
    expect(() => importStrongPlan(db, broken, NOW)).toThrow(DatabaseError);
    for (const table of ['workout', 'workoutExercise', 'workoutSet', 'exercise', 'bodyMeasurement']) {
      expect(count(db, table)).toBe(0);
    }
  });
});
