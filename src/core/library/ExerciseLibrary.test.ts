import { describe, expect, test } from 'vitest';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseLibraryError } from './ExerciseLibraryError';
import type { LibraryExercise } from './LibraryExercise';

function byName(): Map<string, LibraryExercise> {
  return new Map(ExerciseLibrary.bundled().exercises.map((exercise) => [exercise.name, exercise]));
}

/** A library file with one family whose fields the test overrides. */
function singleFamilyJson(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    version: 1,
    families: [
      {
        movement: 'Row',
        pattern: 'horizontal-pull',
        mechanic: 'compound',
        primary: ['lats'],
        variants: ['cable'],
        ...overrides,
      },
    ],
  });
}

function loadError(text: string): ExerciseLibraryError {
  try {
    ExerciseLibrary.fromJson(text);
  } catch (error) {
    if (error instanceof ExerciseLibraryError) return error;
    throw error;
  }
  throw new Error('Expected the library to be rejected.');
}

describe('built-in exercise library', () => {
  test('the bundled file loads and passes validation', () => {
    const library = ExerciseLibrary.bundled();
    expect(library.exercises.length).toBeGreaterThan(400);
    expect(library.version).toBeGreaterThanOrEqual(1);
  });

  test("names follow Strong's style: bare for bodyweight, bracketed equipment otherwise", () => {
    const names = new Set(ExerciseLibrary.bundled().exercises.map((exercise) => exercise.name));
    for (const expected of [
      'Squat (Barbell)',
      'Pull Up',
      'Pull Up (Weighted)',
      'Lateral Raise (Dumbbell)',
      'Triceps Pushdown (Cable - Straight Bar)',
      'Hanging Leg Raise',
      'Calf Press on Leg Press',
    ]) {
      expect(names.has(expected), `missing ${expected}`).toBe(true);
    }
  });

  test('delts are split: lateral raise is side delt, reverse fly is rear delt', () => {
    const exercises = byName();
    expect(exercises.get('Lateral Raise (Dumbbell)')?.primaryMuscles).toEqual(['side-delt']);
    expect(exercises.get('Reverse Fly (Machine)')?.primaryMuscles).toEqual(['rear-delt']);
    expect(exercises.get('Overhead Press (Barbell)')?.primaryMuscles).toEqual(['front-delt']);
  });

  test('variants inherit family fields and can override them', () => {
    const exercises = byName();
    expect(exercises.get('Triceps Extension (Cable)')?.isLengthenedBiased).toBe(true);
    expect(exercises.get('Triceps Extension (Machine)')?.isLengthenedBiased).toBe(false);
    expect(exercises.get('Deadlift (Trap Bar)')?.primaryMuscles[0]).toBe('quads');
    expect(exercises.get('Pull Up')?.tracking).toBe('bodyweight-reps');
    expect(exercises.get('Plank')?.tracking).toBe('duration');
    expect(exercises.get('Chest Fly (Machine)')?.aliases.includes('pec deck')).toBe(true);
  });

  test('every exercise has a unique key that is a slug of its name', () => {
    const exercises = ExerciseLibrary.bundled().exercises;
    expect(new Set(exercises.map((exercise) => exercise.key)).size).toBe(exercises.length);
    for (const exercise of exercises) expect(exercise.key).toBe(ExerciseLibrary.key(exercise.name));
  });
});

describe('ExerciseLibrary naming', () => {
  test('keys are stable slugs of the name', () => {
    expect(ExerciseLibrary.key('Triceps Pushdown (Cable - Rope)')).toBe('triceps-pushdown-cable-rope');
    expect(ExerciseLibrary.key("Farmer's Walk (Dumbbell)")).toBe('farmer-s-walk-dumbbell');
    expect(ExerciseLibrary.key('Café Curl')).toBe('cafe-curl');
  });

  test('bodyweight names carry no equipment suffix', () => {
    expect(ExerciseLibrary.exerciseName('Pull Up', 'bodyweight')).toBe('Pull Up');
    expect(ExerciseLibrary.exerciseName('Pull Up', 'weighted')).toBe('Pull Up (Weighted)');
    expect(ExerciseLibrary.exerciseName('Bench Press', 'smith-machine')).toBe('Bench Press (Smith Machine)');
  });
});

describe('ExerciseLibrary.fromJson validation', () => {
  test('duplicate names are rejected', () => {
    const error = loadError(singleFamilyJson({ variants: ['cable', 'cable'] }));
    expect(error.kind).toBe('duplicateName');
    expect(error.message).toBe('The exercise library lists “Row (Cable)” twice.');
  });

  test("a muscle can't be both primary and secondary", () => {
    const error = loadError(singleFamilyJson({ secondary: ['lats'] }));
    expect(error.kind).toBe('muscleListedTwice');
    expect(error.message).toBe('“Row (Cable)” in the exercise library lists Lats as both primary and secondary.');
  });

  test('an exercise needs a primary muscle', () => {
    const error = loadError(singleFamilyJson({ primary: [] }));
    expect(error.kind).toBe('noPrimaryMuscle');
    expect(error.message).toBe('“Row (Cable)” in the exercise library has no primary muscle.');
  });

  test('unknown muscle slugs are rejected', () => {
    const error = loadError(singleFamilyJson({ primary: ['delts'] }));
    expect(error.kind).toBe('malformed');
    expect(error.message).toContain('families[0].primary[0]');
    expect(error.message).toContain('"delts" is not a known muscle');
  });

  test('text that is not JSON is rejected', () => {
    expect(loadError('{"version": 1,').kind).toBe('malformed');
  });

  test('a variant override replaces the family value and a bare variant inherits it', () => {
    const library = ExerciseLibrary.fromJson(
      singleFamilyJson({
        secondary: ['biceps'],
        aliases: ['family alias'],
        lengthened: true,
        variants: [
          'dumbbell',
          {
            equipment: 'machine',
            name: 'Seated Row Machine',
            primary: ['upper-back'],
            secondary: [],
            aliases: ['variant alias'],
            lengthened: false,
            tracking: 'duration',
          },
        ],
      }),
    );
    const [inherited, overridden] = library.exercises;
    expect(inherited).toMatchObject({
      key: 'row-dumbbell',
      name: 'Row (Dumbbell)',
      primaryMuscles: ['lats'],
      secondaryMuscles: ['biceps'],
      isLengthenedBiased: true,
      tracking: 'weight-reps',
      aliases: ['family alias'],
    });
    expect(overridden).toMatchObject({
      key: 'seated-row-machine',
      name: 'Seated Row Machine',
      primaryMuscles: ['upper-back'],
      secondaryMuscles: [],
      isLengthenedBiased: false,
      tracking: 'duration',
      aliases: ['family alias', 'variant alias'],
    });
  });

  test('bodyweight, weighted and assisted default to bodyweight reps', () => {
    const library = ExerciseLibrary.fromJson(
      singleFamilyJson({ variants: ['bodyweight', 'weighted', 'assisted', 'barbell'] }),
    );
    expect(library.exercises.map((exercise) => exercise.tracking)).toEqual([
      'bodyweight-reps',
      'bodyweight-reps',
      'bodyweight-reps',
      'weight-reps',
    ]);
  });
});
