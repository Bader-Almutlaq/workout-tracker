import { beforeEach, describe, expect, it } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { ExerciseEditor } from './ExerciseEditor';
import { DataSafetyFixture } from '../db/fixtures/DataSafetyFixture';
import { importStrongPlan } from '../import/StrongImporter';
import { makeStrongImportPlan } from '../import/StrongImportPlan';
import { parseStrongWorkoutsFile } from '../import/StrongWorkoutsFile';
import { NEWER_LAYOUT } from '../import/fixtures/StrongFixtures';
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

it('renaming an exercise keeps its old import name resolving to the same exercise', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  const id = ExerciseEditor.create(db, { name: 'Lat Pulldown (Cable)', primaryMuscles: ['lats'] }, now);
  ExerciseEditor.update(db, id, { name: 'My pulldown', primaryMuscles: ['lats'] });
  const imported = importStrongPlan(db, makeStrongImportPlan(parseStrongWorkoutsFile(NEWER_LAYOUT)), now);
  expect(imported.exercisesCreated).toBe(0);
  expect(db.value('SELECT exerciseId FROM workoutExercise')).toBe(id);
  db.close();
});

it('merge moves every history entry, template entry and alias without changing any set field', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  DataSafetyFixture.seed(db);
  const before = DataSafetyFixture.read(db);
  expect(ExerciseEditor.merge(db, 1, 2)).toBe(1);
  const after = DataSafetyFixture.read(db);
  expect(after.workoutSet).toEqual(before.workoutSet);
  expect(after.templateSet).toEqual(before.templateSet);
  expect(after.workout).toEqual(before.workout);
  expect(after.workoutExercise).toEqual(before.workoutExercise?.map((row) => ({ ...row, exerciseId: 2 })));
  expect(after.templateExercise).toEqual(before.templateExercise?.map((row) => ({ ...row, exerciseId: 2 })));
  expect(db.all('SELECT alias, exerciseId FROM exerciseAlias ORDER BY alias')).toEqual([
    { alias: 'Alternate α', exerciseId: 2 },
    { alias: 'Custom α', exerciseId: 2 },
    { alias: 'Old merged name', exerciseId: 2 },
  ]);
  expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  db.close();
});

it('foreign keys refuse deletion of an exercise used by history or only by a template', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  DataSafetyFixture.seed(db);
  const before = DataSafetyFixture.read(db);
  expect(() => db.run('DELETE FROM exercise WHERE id = 1')).toThrow();
  expect(DataSafetyFixture.read(db)).toEqual(before);
  db.run('DELETE FROM workoutExercise WHERE exerciseId = 1');
  const templateOnly = DataSafetyFixture.read(db);
  expect(() => db.run('DELETE FROM exercise WHERE id = 1')).toThrow();
  expect(DataSafetyFixture.read(db)).toEqual(templateOnly);
  db.close();
});

it('stores loading overrides on create, preserves omitted fields on update, and clears explicit null', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  const settings = { loadStepKilograms: 2, barWeightKilograms: 17.25, warmupSetCount: 4 };
  try {
    const id = ExerciseEditor.create(db, { ...draft, ...settings }, now);
    const read = () =>
      db.get('SELECT loadStepKilograms, barWeightKilograms, warmupSetCount FROM exercise WHERE id = ?', [id]);
    expect(read()).toEqual(settings);
    ExerciseEditor.update(db, id, draft);
    expect(read()).toEqual(settings);
    ExerciseEditor.update(db, id, { ...draft, loadStepKilograms: null, barWeightKilograms: null, warmupSetCount: 0 });
    expect(read()).toEqual({ loadStepKilograms: null, barWeightKilograms: null, warmupSetCount: 0 });
  } finally {
    db.close();
  }
});

it('loading-only edits work on library exercises without changing their frozen metadata', async () => {
  const db = await Database.openInMemory();
  migrate(db);
  try {
    db.run(`
      INSERT INTO exercise (id, name, source, libraryKey, createdAt)
      VALUES (1, 'Synthetic library bench', 'library', 'synthetic-bench', '2026-01-01')
    `);
    const before = db.get('SELECT * FROM exercise WHERE id = 1');
    ExerciseEditor.setLoadingSettings(db, 1, { loadStepKilograms: 1.25, barWeightKilograms: 0, warmupSetCount: 0 });
    expect(db.get('SELECT * FROM exercise WHERE id = 1')).toEqual({
      ...before,
      loadStepKilograms: 1.25,
      barWeightKilograms: 0,
      warmupSetCount: 0,
    });
    ExerciseEditor.setLoadingSettings(db, 1, {});
    expect(db.get('SELECT * FROM exercise WHERE id = 1')).toEqual(before);
    expect(() => ExerciseEditor.setLoadingSettings(db, -1, {})).toThrow('no longer exists');
  } finally {
    db.close();
  }
});

it.each([
  { loadStepKilograms: 0 },
  { loadStepKilograms: -1 },
  { loadStepKilograms: NaN },
  { loadStepKilograms: Infinity },
  { barWeightKilograms: -1 },
  { barWeightKilograms: NaN },
  { barWeightKilograms: Infinity },
  { warmupSetCount: -1 },
  { warmupSetCount: 5 },
  { warmupSetCount: 1.5 },
  { warmupSetCount: NaN },
])('invalid loading settings fail atomically: %j', async (settings) => {
  const db = await Database.openInMemory();
  migrate(db);
  try {
    const id = ExerciseEditor.create(db, draft, now);
    const before = DataSafetyFixture.read(db);
    expect(() => ExerciseEditor.setLoadingSettings(db, id, settings)).toThrow('Use a positive load step');
    expect(() => ExerciseEditor.create(db, { ...draft, name: 'Invalid', ...settings }, now)).toThrow(
      'Use a positive load step',
    );
    expect(() => ExerciseEditor.update(db, id, { ...draft, ...settings })).toThrow('Use a positive load step');
    expect(DataSafetyFixture.read(db)).toEqual(before);
  } finally {
    db.close();
  }
});
