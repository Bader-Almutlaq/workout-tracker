import { describe, expect, test } from 'vitest';
import { Database } from '../db/Database';
import { migrate } from '../db/migrations';
import { BodyMeasurementSite, fromBodyMeasurementRow, type BodyMeasurementRow } from './BodyMeasurement';
import { fromExerciseRow, type ExerciseRow } from './Exercise';
import { fromExerciseAliasRow, type ExerciseAliasRow } from './ExerciseAlias';
import { fromExerciseMuscleRow, type ExerciseMuscleRow } from './ExerciseMuscle';
import { RECORD_SOURCES } from './RecordSource';
import { SET_KINDS, isWorkSetKind } from './SetKind';
import { SET_SIDES } from './SetSide';
import { fromWorkoutRow, type WorkoutRow } from './Workout';
import { fromWorkoutExerciseRow, type WorkoutExerciseRow } from './WorkoutExercise';
import { fromWorkoutSetRow, type WorkoutSetRow } from './WorkoutSet';

async function migratedDatabase(): Promise<Database> {
  const db = await Database.openInMemory();
  migrate(db);
  return db;
}

/** Inserts one exercise, one workout and one workout exercise; returns their ids. */
function seedWorkoutExercise(db: Database): { exerciseId: number; workoutId: number; workoutExerciseId: number } {
  const exerciseId = db.run(
    "INSERT INTO exercise (name, source, createdAt) VALUES ('Bench Press (Barbell)', 'strong', '2026-10-30T10:00:00.000Z')",
  ).lastInsertRowId;
  const workoutId = db.run(
    "INSERT INTO workout (startedAt, name, source) VALUES ('2026-10-30T10:00:00.000Z', 'Push', 'strong')",
  ).lastInsertRowId;
  const workoutExerciseId = db.run('INSERT INTO workoutExercise (workoutId, exerciseId, position) VALUES (?, ?, 0)', [
    workoutId,
    exerciseId,
  ]).lastInsertRowId;
  return { exerciseId, workoutId, workoutExerciseId };
}

describe('enums', () => {
  test('Set kinds and sides list every value the schema accepts', async () => {
    const db = await migratedDatabase();
    const { workoutExerciseId } = seedWorkoutExercise(db);
    SET_KINDS.forEach((kind, position) => {
      db.run(
        "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps) VALUES (?, ?, ?, 0, 'kg', 1)",
        [workoutExerciseId, position, kind],
      );
    });
    SET_SIDES.forEach((side, position) => {
      db.run(
        "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, side) VALUES (?, ?, 'working', 0, 'kg', 1, ?)",
        [workoutExerciseId, position + SET_KINDS.length, side],
      );
    });
    expect(db.value('SELECT count(*) FROM workoutSet')).toBe(SET_KINDS.length + SET_SIDES.length);
  });

  test('Record sources are the union of what the tables accept', () => {
    // exercise: library, custom, strong; workout and bodyMeasurement: app, strong.
    expect([...RECORD_SOURCES].sort()).toEqual(['app', 'custom', 'library', 'strong']);
  });

  test('Only warm-ups are not work', () => {
    expect(SET_KINDS.filter((kind) => !isWorkSetKind(kind))).toEqual(['warmup']);
  });
});

describe('row conversion', () => {
  test('An exercise row converts its 0/1 columns to booleans', async () => {
    const db = await migratedDatabase();
    db.run(
      `INSERT INTO exercise (name, equipment, movementPattern, mechanic, source, libraryKey, isLengthenedBiased,
                             tracking, defaultEntryUnit, isArchived, createdAt)
       VALUES ('Bayesian Curl (Cable)', 'cable', 'curl', 'isolation', 'library', 'bayesian-curl-cable', 1,
               'weight-reps', 'lb', 0, '2026-10-30T10:00:00.000Z')`,
    );
    db.run(
      "INSERT INTO exercise (name, source, isArchived, createdAt) VALUES ('Plain', 'custom', 1, '2026-10-30T10:00:00.000Z')",
    );

    const [library, plain] = db.all<ExerciseRow>('SELECT * FROM exercise ORDER BY id').map(fromExerciseRow);
    expect(library).toMatchObject({
      name: 'Bayesian Curl (Cable)',
      equipment: 'cable',
      movementPattern: 'curl',
      mechanic: 'isolation',
      source: 'library',
      libraryKey: 'bayesian-curl-cable',
      isLengthenedBiased: true,
      tracking: 'weight-reps',
      defaultEntryUnit: 'lb',
      isArchived: false,
      createdAt: '2026-10-30T10:00:00.000Z',
    });
    expect(plain).toMatchObject({
      equipment: null,
      movementPattern: null,
      mechanic: null,
      libraryKey: null,
      isLengthenedBiased: false,
      tracking: 'weight-reps',
      defaultEntryUnit: 'kg',
      isArchived: true,
    });
  });

  test('An exerciseMuscle row converts unchanged', async () => {
    const db = await migratedDatabase();
    const { exerciseId } = seedWorkoutExercise(db);
    db.run("INSERT INTO exerciseMuscle (exerciseId, muscleId, role) VALUES (?, 'chest', 'primary')", [exerciseId]);
    const row = db.get<ExerciseMuscleRow>('SELECT * FROM exerciseMuscle');
    expect(row && fromExerciseMuscleRow(row)).toEqual({ exerciseId, muscleId: 'chest', role: 'primary' });
  });

  test('An exerciseAlias row converts unchanged', async () => {
    const db = await migratedDatabase();
    const { exerciseId } = seedWorkoutExercise(db);
    db.run("INSERT INTO exerciseAlias (alias, exerciseId) VALUES ('Flat Bench', ?)", [exerciseId]);
    const row = db.get<ExerciseAliasRow>('SELECT * FROM exerciseAlias');
    expect(row && fromExerciseAliasRow(row)).toEqual({ alias: 'Flat Bench', exerciseId });
  });

  test('A workout row converts isInProgress to a boolean and keeps nulls', async () => {
    const db = await migratedDatabase();
    db.run(
      "INSERT INTO workout (startedAt, endedAt, name, notes, source, sourceKey, isInProgress) VALUES ('2026-10-30T10:00:00.000Z', '2026-10-30T11:00:00.000Z', 'Pull', 'Felt good', 'strong', 'strong:2026-10-30 10:00:00', 0)",
    );
    db.run(
      "INSERT INTO workout (startedAt, name, source, isInProgress) VALUES ('2026-10-31T10:00:00.000Z', 'Live', 'app', 1)",
    );

    const [finished, live] = db.all<WorkoutRow>('SELECT * FROM workout ORDER BY id').map(fromWorkoutRow);
    expect(finished).toMatchObject({
      startedAt: '2026-10-30T10:00:00.000Z',
      endedAt: '2026-10-30T11:00:00.000Z',
      name: 'Pull',
      notes: 'Felt good',
      source: 'strong',
      sourceKey: 'strong:2026-10-30 10:00:00',
      isInProgress: false,
    });
    expect(live).toMatchObject({ endedAt: null, notes: null, sourceKey: null, source: 'app', isInProgress: true });
  });

  test('A workoutExercise row converts unchanged', async () => {
    const db = await migratedDatabase();
    const { workoutId, exerciseId } = seedWorkoutExercise(db);
    db.run('UPDATE workoutExercise SET supersetGroup = 2, notes = ?', ['Pause reps']);
    const row = db.get<WorkoutExerciseRow>('SELECT * FROM workoutExercise');
    expect(row && fromWorkoutExerciseRow(row)).toEqual({
      id: 1,
      workoutId,
      exerciseId,
      position: 0,
      supersetGroup: 2,
      notes: 'Pause reps',
      machineBrand: null,
      deloadStage: null,
    });
  });

  test('A workoutSet row converts isCompleted to a boolean and keeps nulls', async () => {
    const db = await migratedDatabase();
    const { workoutExerciseId } = seedWorkoutExercise(db);
    db.run(
      `INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, rpe, durationSeconds,
                               distanceMeters, side, restBeforeSeconds, completedAt, isCompleted, notes)
       VALUES (?, 0, 'drop', 61.23, 'lb', 8, 8.5, 45, 100, 'left', 90, '2026-10-30T10:05:00.000Z', 1, 'Slow')`,
      [workoutExerciseId],
    );
    db.run(
      "INSERT INTO workoutSet (workoutExerciseId, position, kind, weightKilograms, entryUnit, reps, isCompleted) VALUES (?, 1, 'working', 0, 'kg', 0, 0)",
      [workoutExerciseId],
    );

    const [done, planned] = db.all<WorkoutSetRow>('SELECT * FROM workoutSet ORDER BY id').map(fromWorkoutSetRow);
    expect(done).toMatchObject({
      workoutExerciseId,
      position: 0,
      kind: 'drop',
      weightKilograms: 61.23,
      entryUnit: 'lb',
      reps: 8,
      rpe: 8.5,
      durationSeconds: 45,
      distanceMeters: 100,
      side: 'left',
      restBeforeSeconds: 90,
      completedAt: '2026-10-30T10:05:00.000Z',
      isCompleted: true,
      notes: 'Slow',
    });
    expect(planned).toMatchObject({
      rpe: null,
      durationSeconds: null,
      distanceMeters: null,
      side: 'both',
      restBeforeSeconds: null,
      completedAt: null,
      isCompleted: false,
      notes: null,
    });
  });

  test('A bodyMeasurement row converts unchanged', async () => {
    const db = await migratedDatabase();
    db.run(
      `INSERT INTO bodyMeasurement (takenAt, site, value, source) VALUES ('2026-10-30T07:00:00.000Z', '${BodyMeasurementSite.bodyweight}', 84.5, 'app')`,
    );
    const row = db.get<BodyMeasurementRow>('SELECT * FROM bodyMeasurement');
    expect(row && fromBodyMeasurementRow(row)).toEqual({
      id: 1,
      takenAt: '2026-10-30T07:00:00.000Z',
      site: 'bodyweight',
      value: 84.5,
      source: 'app',
      state: 'relaxed',
      entryUnit: null,
    });
  });
});
