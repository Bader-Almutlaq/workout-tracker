import { beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { ExerciseEditor } from './ExerciseEditor';
import type { CustomExerciseDraft } from './CustomExerciseDraft';

const now = new Date('2026-01-01T00:00:00Z');
const draft: CustomExerciseDraft = {
  name: '  Panatta Lateral  ',
  equipment: 'machine',
  primaryMuscles: ['side-delt'],
  secondaryMuscles: ['side-delt', 'upper-traps'],
};
describe('exercise editing', () => {
  let db: Database;
  beforeEach(async () => {
    db = await Database.openInMemory();
    migrate(db, now);
  });
  it('trims and stores muscles without primary duplicates', () => {
    const id = ExerciseEditor.create(db, draft, now);
    expect(db.get('SELECT name, source FROM exercise WHERE id = ?', [id])).toEqual({
      name: 'Panatta Lateral',
      source: 'custom',
    });
    expect(db.all('SELECT muscleId, role FROM exerciseMuscle WHERE exerciseId = ? ORDER BY muscleId', [id])).toEqual([
      { muscleId: 'side-delt', role: 'primary' },
      { muscleId: 'upper-traps', role: 'secondary' },
    ]);
  });
  it('validates names and primary muscles', () => {
    ExerciseEditor.create(db, draft, now);
    expect(() => ExerciseEditor.create(db, { ...draft, name: 'panatta lateral' }, now)).toThrow(
      'An exercise called “panatta lateral” already exists.',
    );
    expect(() => ExerciseEditor.create(db, { name: ' ', primaryMuscles: ['chest'] }, now)).toThrow(
      'Give the exercise a name.',
    );
    expect(() => ExerciseEditor.create(db, { name: 'X' }, now)).toThrow('Pick at least one primary muscle.');
  });
  it('keeps library exercises read-only', () => {
    db.run(
      "INSERT INTO exercise (name, source, libraryKey, createdAt) VALUES ('Squat (Barbell)', 'library', 'squat-barbell', '2026-01-01')",
    );
    expect(() => ExerciseEditor.update(db, 1, draft)).toThrow('Built-in exercises');
  });
  it('moves history, keeps the name as alias and adopts the unit', () => {
    db.exec(
      "INSERT INTO exercise (id, name, source, defaultEntryUnit, createdAt) VALUES (1, 'Bayesian Cable Curl', 'strong', 'lb', '2026-01-01'); INSERT INTO exercise (id, name, source, libraryKey, createdAt) VALUES (2, 'Bayesian Curl (Cable)', 'library', 'bayesian-curl-cable', '2026-01-01'); INSERT INTO workout (id, startedAt, name, source) VALUES (1, '2026-01-01 10:00:00', 'Arms', 'strong'); INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (1, 1, 0)",
    );
    expect(ExerciseEditor.merge(db, 1, 2)).toBe(1);
    expect(db.value('SELECT count(*) FROM exercise WHERE id = 1')).toBe(0);
    expect(db.value('SELECT exerciseId FROM exerciseAlias WHERE alias = ?', ['bayesian cable curl'])).toBe(2);
    expect(db.value('SELECT defaultEntryUnit FROM exercise WHERE id = 2')).toBe('lb');
    expect(() => ExerciseEditor.merge(db, 2, 2)).toThrow('itself');
  });
  it('merges a batch atomically', () => {
    db.exec(
      "INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'A', 'strong', '2026-01-01'), (2, 'B', 'strong', '2026-01-01'), (3, 'Target', 'custom', '2026-01-01')",
    );
    expect(() =>
      ExerciseEditor.mergeAll(
        db,
        new Map([
          [1, 3],
          [2, 99],
        ]),
      ),
    ).toThrow('no longer exists');
    expect(db.value('SELECT count(*) FROM exercise')).toBe(3);
    ExerciseEditor.mergeAll(
      db,
      new Map([
        [1, 3],
        [2, 3],
      ]),
    );
    expect(db.value('SELECT count(*) FROM exercise')).toBe(1);
    expect(db.value('SELECT count(*) FROM exerciseAlias')).toBe(2);
  });
});

it('moves template exercise references when merging', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  db.exec(`INSERT INTO exercise (id, name, source, createdAt) VALUES (1, 'Source', 'custom', 'a'), (2, 'Target', 'custom', 'a');
    INSERT INTO template (id, name, position, createdAt, updatedAt) VALUES (1, 'Plan', 0, 'a', 'a');
    INSERT INTO templateExercise (templateId, exerciseId, position) VALUES (1, 1, 0);`);
  ExerciseEditor.merge(db, 1, 2);
  expect(db.value('SELECT exerciseId FROM templateExercise')).toBe(2);
});
