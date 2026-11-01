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

it('fills exact-variant details, leaves custom exercises untouched, and re-seeds idempotently', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.run(`INSERT INTO exercise (name, source, createdAt, instructions, imageKeys)
      VALUES ('Custom movement', 'custom', '2026-01-01', 'My instructions', '["custom/0.jpg"]')`);
    const customBefore = db.get('SELECT * FROM exercise WHERE source = ?', ['custom']);
    const detailed = (version: number) =>
      ExerciseLibrary.fromJson(
        JSON.stringify({
          version,
          families: [
            {
              movement: 'Bench Press',
              pattern: 'horizontal-push',
              mechanic: 'compound',
              primary: ['chest'],
              variants: [
                { equipment: 'barbell', instructions: ['Start.', 'Press.'], imageKeys: ['Bench/0.jpg', 'Bench/1.jpg'] },
                'dumbbell',
              ],
            },
          ],
        }),
      );
    ExerciseLibrarySeeder.seed(db, detailed(1), now);
    expect(
      db.get('SELECT instructions, imageKeys FROM exercise WHERE libraryKey = ?', ['bench-press-barbell']),
    ).toEqual({ instructions: 'Start.\nPress.', imageKeys: '["Bench/0.jpg","Bench/1.jpg"]' });
    expect(
      db.get('SELECT instructions, imageKeys FROM exercise WHERE libraryKey = ?', ['bench-press-dumbbell']),
    ).toEqual({ instructions: null, imageKeys: null });
    const before = db.all('SELECT * FROM exercise');
    expect(ExerciseLibrarySeeder.seed(db, detailed(1), now).skipped).toBe(true);
    expect(ExerciseLibrarySeeder.seed(db, detailed(2), now).updated).toBe(2);
    expect(db.all('SELECT * FROM exercise')).toEqual(before);
    expect(db.get('SELECT * FROM exercise WHERE source = ?', ['custom'])).toEqual(customBefore);
  } finally {
    db.close();
  }
});

it('does not claim a custom exercise when an expansion adds the same name', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    db.run(`INSERT INTO exercise (name, source, createdAt)
      VALUES ('Bench Press (Barbell)', 'custom', '2026-01-01')`);
    const before = db.get('SELECT * FROM exercise WHERE source = ?', ['custom']);
    const result = ExerciseLibrarySeeder.seed(db, library(), now);
    expect(result.inserted).toBe(1);
    expect(result.linked).toBe(0);
    expect(db.get('SELECT * FROM exercise WHERE source = ?', ['custom'])).toEqual(before);
    expect(db.value('SELECT instructions FROM exercise WHERE source = ?', ['custom'])).toBeNull();
  } finally {
    db.close();
  }
});

it('seeds ten direct lower-trap variants without tagging rows or pulldowns', async () => {
  const db = await Database.openInMemory();
  try {
    migrate(db);
    const bundled = ExerciseLibrary.bundled();
    expect(ExerciseLibrarySeeder.seed(db, bundled, now).inserted).toBe(bundled.exercises.length);
    expect(db.value(`SELECT COUNT(*) FROM exerciseMuscle WHERE muscleId = 'lower-traps' AND role = 'secondary'`)).toBe(
      10,
    );
    expect(
      db.value(`
      SELECT COUNT(*) FROM exerciseMuscle em JOIN exercise e ON e.id = em.exerciseId
      WHERE em.muscleId = 'lower-traps' AND (e.name LIKE '%Row%' OR e.name LIKE '%Pulldown%')
    `),
    ).toBe(0);
  } finally {
    db.close();
  }
});
