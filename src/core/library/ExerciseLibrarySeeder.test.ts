import { beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseLibrarySeeder } from './ExerciseLibrarySeeder';

const now = new Date('2026-01-01T00:00:00Z');
function library(version = 1, primary = 'chest'): ExerciseLibrary {
  return ExerciseLibrary.fromJson(
    JSON.stringify({
      version,
      families: [
        {
          movement: 'Bench Press',
          pattern: 'horizontal-push',
          mechanic: 'compound',
          primary: [primary],
          secondary: ['triceps'],
          variants: ['barbell', 'dumbbell'],
        },
      ],
    }),
  );
}
describe('library seeding', () => {
  let db: Database;
  beforeEach(async () => {
    db = await Database.openInMemory();
    migrate(db, now);
  });
  it('inserts every exercise and its muscles', () => {
    expect(ExerciseLibrarySeeder.seed(db, library(), now)).toEqual({
      inserted: 2,
      linked: 0,
      updated: 0,
      skipped: false,
    });
    expect(db.value('SELECT count(*) FROM exerciseMuscle')).toBe(4);
    expect(db.get('SELECT source, equipment FROM exercise WHERE libraryKey = ?', ['bench-press-barbell'])).toEqual({
      source: 'library',
      equipment: 'barbell',
    });
  });
  it('skips the same version', () => {
    ExerciseLibrarySeeder.seed(db, library(), now);
    expect(ExerciseLibrarySeeder.seed(db, library(), now).skipped).toBe(true);
  });
  it('updates muscles while preserving unit and archive', () => {
    ExerciseLibrarySeeder.seed(db, library(), now);
    db.run("UPDATE exercise SET defaultEntryUnit = 'lb', isArchived = 1 WHERE libraryKey = 'bench-press-barbell'");
    expect(ExerciseLibrarySeeder.seed(db, library(2, 'front-delt'), now).updated).toBe(2);
    expect(
      db.get("SELECT defaultEntryUnit, isArchived FROM exercise WHERE libraryKey = 'bench-press-barbell'"),
    ).toEqual({ defaultEntryUnit: 'lb', isArchived: 1 });
    expect(
      db.value(
        "SELECT muscleId FROM exerciseMuscle WHERE role = 'primary' AND exerciseId = (SELECT id FROM exercise WHERE libraryKey = 'bench-press-barbell')",
      ),
    ).toBe('front-delt');
  });
  it('links a same-name Strong exercise without losing history', () => {
    db.exec(
      "INSERT INTO exercise (id, name, source, createdAt) VALUES (7, 'bench press (barbell)', 'strong', '2026-01-01'); INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01 10:00:00', 'Push', 'strong'); INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (1, 7, 0)",
    );
    expect(ExerciseLibrarySeeder.seed(db, library(), now)).toEqual({
      inserted: 1,
      linked: 1,
      updated: 0,
      skipped: false,
    });
    expect(db.get('SELECT name, source, libraryKey FROM exercise WHERE id = 7')).toEqual({
      name: 'Bench Press (Barbell)',
      source: 'library',
      libraryKey: 'bench-press-barbell',
    });
    expect(db.value('SELECT exerciseId FROM workoutExercise')).toBe(7);
  });
});
