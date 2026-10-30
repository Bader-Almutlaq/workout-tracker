import { EQUIPMENT_DISPLAY_NAMES, type Equipment } from './Equipment';
import { ExerciseLibraryError } from './ExerciseLibraryError';
import type { ExerciseTracking } from './ExerciseTracking';
import type { LibraryExercise } from './LibraryExercise';
import { parseLibraryFile, type LibraryFamily } from './LibraryFile';
import { MUSCLE_DISPLAY_NAMES } from './Muscle';
import { SearchText } from './SearchText';
import libraryJson from './library.json';

/** The tracking an exercise gets when neither its family nor its variant names one. */
function defaultTracking(equipment: Equipment): ExerciseTracking {
  switch (equipment) {
    case 'bodyweight':
    case 'weighted':
    case 'assisted':
      return 'bodyweight-reps';
    default:
      return 'weight-reps';
  }
}

function expand(family: LibraryFamily): LibraryExercise[] {
  return family.variants.map((variant) => {
    const name = variant.name ?? ExerciseLibrary.exerciseName(family.movement, variant.equipment);
    return {
      key: ExerciseLibrary.key(name),
      name,
      equipment: variant.equipment,
      pattern: family.pattern,
      mechanic: family.mechanic,
      primaryMuscles: variant.primary ?? family.primary,
      secondaryMuscles: variant.secondary ?? family.secondary ?? [],
      isLengthenedBiased: variant.lengthened ?? family.lengthened ?? false,
      tracking: variant.tracking ?? family.tracking ?? defaultTracking(variant.equipment),
      aliases: [...(family.aliases ?? []), ...(variant.aliases ?? [])],
    };
  });
}

function validate(exercises: readonly LibraryExercise[]): void {
  const seenKeys = new Set<string>();
  for (const exercise of exercises) {
    if (seenKeys.has(exercise.key)) {
      throw new ExerciseLibraryError('duplicateName', `The exercise library lists “${exercise.name}” twice.`);
    }
    seenKeys.add(exercise.key);
    if (exercise.primaryMuscles.length === 0) {
      throw new ExerciseLibraryError(
        'noPrimaryMuscle',
        `“${exercise.name}” in the exercise library has no primary muscle.`,
      );
    }
    const overlap = exercise.primaryMuscles.find((muscle) => exercise.secondaryMuscles.includes(muscle));
    if (overlap !== undefined) {
      throw new ExerciseLibraryError(
        'muscleListedTwice',
        `“${exercise.name}” in the exercise library lists ${MUSCLE_DISPLAY_NAMES[overlap]} as both primary and secondary.`,
      );
    }
  }
}

/**
 * The built-in exercise library: about 420 exercises in Strong's naming style, with muscles
 * tagged to the `Muscle` taxonomy.
 *
 * Source of truth is `library.json` (hand-curated; see `docs/DECISIONS.md`). This type loads it,
 * expands each family into its equipment variants, and validates the result.
 */
export class ExerciseLibrary {
  private constructor(
    /** The file's version. The seeder re-seeds when it changes. */
    readonly version: number,
    /** Every exercise, in file order. */
    readonly exercises: readonly LibraryExercise[],
  ) {}

  /**
   * Loads the library bundled with the app.
   * @throws ExerciseLibraryError when `library.json` breaks a rule; the tests catch this before release.
   */
  static bundled(): ExerciseLibrary {
    return ExerciseLibrary.fromParsedJson(libraryJson);
  }

  /**
   * Parses and validates library JSON text. Used by tests, which feed small files.
   * @throws ExerciseLibraryError when the text is not valid library JSON (kind `malformed`), lists a
   *   name twice, has an exercise without a primary muscle, or lists a muscle as primary and secondary.
   */
  static fromJson(text: string): ExerciseLibrary {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new ExerciseLibraryError('malformed', 'The exercise library is not valid JSON.', error);
    }
    return ExerciseLibrary.fromParsedJson(parsed);
  }

  private static fromParsedJson(json: unknown): ExerciseLibrary {
    const file = parseLibraryFile(json);
    const exercises = file.families.flatMap(expand);
    validate(exercises);
    return new ExerciseLibrary(file.version, exercises);
  }

  /**
   * The display name for `movement` done with `equipment`: "Movement (Equipment)", or just
   * "Movement" for bodyweight, matching Strong's built-in names.
   */
  static exerciseName(movement: string, equipment: Equipment): string {
    return equipment === 'bodyweight' ? movement : `${movement} (${EQUIPMENT_DISPLAY_NAMES[equipment]})`;
  }

  /**
   * Turns a display name into a stable key: lowercase ASCII-folded words joined by hyphens, with
   * every character that is not a letter or digit acting as a separator.
   * "Triceps Pushdown (Cable - Rope)" → "triceps-pushdown-cable-rope".
   */
  static key(name: string): string {
    return SearchText.words(name).join('-');
  }
}
