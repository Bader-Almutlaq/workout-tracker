import { beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { ExerciseLibrary } from '../library/ExerciseLibrary';
import { ExerciseLibrarySeeder } from '../library/ExerciseLibrarySeeder';
import { ExerciseCatalog } from './ExerciseCatalog';

const now = new Date('2026-01-01T00:00:00Z');
const library = ExerciseLibrary.fromJson(
  JSON.stringify({
    version: 1,
    families: [
      {
        movement: 'Bench Press',
        pattern: 'horizontal-push',
        mechanic: 'compound',
        primary: ['chest'],
        secondary: ['triceps'],
        aliases: ['bp'],
        variants: ['barbell'],
      },
    ],
  }),
);
describe('exercise catalog', () => {
  let db: Database;
  beforeEach(async () => {
    db = await Database.openInMemory();
    migrate(db, now);
    ExerciseLibrarySeeder.seed(db, library, now);
    db.exec(
      "INSERT INTO exercise (id, name, source, createdAt) VALUES (50, 'Cable Grip', 'strong', '2026-01-01'); INSERT INTO exercise (id, name, source, isArchived, createdAt) VALUES (51, 'Old Thing', 'custom', 1, '2026-01-01'); INSERT INTO exerciseAlias (alias, exerciseId) VALUES ('Flat Press', 1); INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01T10:00:00.000Z', 'A', 'app'), (2, '2026-02-01T10:00:00.000Z', 'B', 'app'); INSERT INTO workoutExercise (id, workoutId, exerciseId, position) VALUES (1, 1, 1, 0), (2, 2, 1, 0), (3, 2, 50, 1); INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps) VALUES (1, 0, 'warmup', 60, 'kg', 10), (1, 1, 'working', 100, 'kg', 5), (2, 0, 'working', 100, 'kg', 6), (2, 1, 'working', 102.5, 'kg', 3), (3, 0, 'working', 20, 'kg', 30)",
    );
  });
  it('includes muscles, aliases, usage and dates, excluding archived exercises', () => {
    const entries = ExerciseCatalog.entries(db, library);
    expect(entries.map((entry) => entry.name).sort()).toEqual(['Bench Press (Barbell)', 'Cable Grip']);
    expect(entries.find((entry) => entry.id === 1)).toMatchObject({
      aliases: ['bp', 'Flat Press'],
      primaryMuscles: ['chest'],
      secondaryMuscles: ['triceps'],
      usageCount: 2,
      lastUsedAt: new Date('2026-02-01T10:00:00Z'),
      isCustom: false,
    });
    expect(entries.find((entry) => entry.id === 50)?.isCustom).toBe(true);
  });
  it('summarizes usage and recent top sets', () => {
    const detail = ExerciseCatalog.detail(db, 1, library);
    expect(detail).toMatchObject({ workoutCount: 2, setCount: 4, firstUsedAt: new Date('2026-01-01T10:00:00Z') });
    expect(detail?.recentSessions.map((session) => session.workoutId)).toEqual([2, 1]);
    expect(detail?.recentSessions[0]?.topSet?.weightKilograms).toBe(102.5);
    expect(detail?.recentSessions[1]?.workSetCount).toBe(1);
  });
  it('lists unmatched Strong exercises by set count', () => {
    const unmatched = ExerciseCatalog.unmatchedImports(db);
    expect(unmatched.map((entry) => entry.exercise.name)).toEqual(['Cable Grip']);
    expect(unmatched[0]?.setCount).toBe(1);
  });
});
