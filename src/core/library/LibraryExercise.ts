import type { Equipment } from './Equipment';
import type { ExerciseTracking } from './ExerciseTracking';
import type { Mechanic } from './Mechanic';
import type { Muscle } from './Muscle';
import type { MovementPattern } from './MovementPattern';

/** One exercise from the built-in library, fully resolved (family fields merged with its variant's overrides). */
export interface LibraryExercise {
  /**
   * Stable identifier derived from the name, e.g. "lateral-raise-dumbbell". Stored in
   * `exercise.libraryKey`; it ties database rows to library entries across app updates.
   */
  readonly key: string;
  /** Display name in Strong's style: "Movement (Equipment)", or the bare movement for bodyweight. */
  readonly name: string;
  /** What the exercise is performed with. */
  readonly equipment: Equipment;
  /** The joint action it trains. */
  readonly pattern: MovementPattern;
  /** One joint or several. */
  readonly mechanic: Mechanic;
  /** Prime movers, in order of emphasis. Never empty. */
  readonly primaryMuscles: readonly Muscle[];
  /** Meaningful synergists. Never overlaps `primaryMuscles`. */
  readonly secondaryMuscles: readonly Muscle[];
  /** Loads the target muscle hardest at long lengths (report, "long-muscle-length emphasis"). */
  readonly isLengthenedBiased: boolean;
  /** What a set of this exercise records. */
  readonly tracking: ExerciseTracking;
  /** Other names and gym slang that should find this exercise in search. */
  readonly aliases: readonly string[];
}
