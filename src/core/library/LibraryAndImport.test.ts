import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { OLDER_LAYOUT } from '../import/fixtures/StrongFixtures';
import { makeStrongImportPlan } from '../import/StrongImportPlan';
import { importStrongPlan } from '../import/StrongImporter';
import { parseStrongWorkoutsFile } from '../import/StrongWorkoutsFile';
import { ExerciseEditor } from './ExerciseEditor';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseLibrarySeeder } from './ExerciseLibrarySeeder';
import { exerciseIdNamed } from './ExerciseNameResolver';

// Strong timestamps are local time; pin the zone so results don't depend on the machine.
vi.stubEnv('TZ', 'UTC');

const NOW = new Date('2026-10-30T12:00:00.000Z');

/** The importer and the library together, ported from the native seeder and editor tests. */
describe('library and Strong import together', () => {
  let db: Database;

  beforeEach(async () => {
    db = await Database.openInMemory();
    migrate(db, NOW);
  });

  const importOlderLayout = () =>
    importStrongPlan(db, makeStrongImportPlan(parseStrongWorkoutsFile(OLDER_LAYOUT)), NOW);

  test("importing after seeding lands on library exercises and adopts Strong's unit", () => {
    ExerciseLibrarySeeder.seed(db, ExerciseLibrary.bundled(), NOW);
    const before = db.value<number>('SELECT count(*) FROM exercise');

    const result = importOlderLayout();

    expect(result.exercisesCreated).toBe(0);
    expect(db.value<number>('SELECT count(*) FROM exercise')).toBe(before);
    expect(
      db.get('SELECT source, defaultEntryUnit FROM exercise WHERE name = ?', ['Seated Leg Curl (Machine)']),
    ).toEqual({ source: 'library', defaultEntryUnit: 'lb' });
  });

  test('a re-import after a merge lands on the merged exercise', () => {
    importOlderLayout();
    const target = ExerciseEditor.create(db, { name: 'Flat Press', primaryMuscles: ['chest'] }, NOW);
    const source = exerciseIdNamed(db, 'Bench Press (Barbell)');
    expect(source).toBeDefined();
    ExerciseEditor.merge(db, source ?? -1, target);
    db.run('DELETE FROM workout');

    const result = importOlderLayout();

    expect(result.exercisesCreated).toBe(0);
  });
});
