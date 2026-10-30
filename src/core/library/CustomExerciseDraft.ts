import type { Equipment } from './Equipment';
import type { ExerciseTracking } from './ExerciseTracking';
import type { Mechanic } from './Mechanic';
import type { MovementPattern } from './MovementPattern';
import type { Muscle } from './Muscle';
import type { LibraryExercise } from './LibraryExercise';

/** Fields entered for a custom exercise. Omitted fields use the native defaults. */
export interface CustomExerciseDraft {
  /** Exact kg increment; null resets to the equipment default. */
  readonly loadStepKilograms?: number | null;
  /** Exact kg empty bar/carriage; null resets to the equipment default. */
  readonly barWeightKilograms?: number | null;
  /** 0–4 suggested warm-ups; null resets to the equipment default. */
  readonly warmupSetCount?: number | null;
  readonly name?: string;
  readonly equipment?: Equipment | null;
  readonly pattern?: MovementPattern | null;
  readonly mechanic?: Mechanic | null;
  readonly primaryMuscles?: readonly Muscle[];
  readonly secondaryMuscles?: readonly Muscle[];
  readonly isLengthenedBiased?: boolean;
  readonly tracking?: ExerciseTracking;
}

/** Pre-fills a custom draft from a built-in exercise, appending " (Copy)" to its name. */
export function copyExerciseDraft(entry: LibraryExercise): CustomExerciseDraft {
  return { ...entry, name: `${entry.name} (Copy)` };
}
