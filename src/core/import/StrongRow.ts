import type { WeightUnit } from '../units/WeightUnit';
import type { WorkoutFileFormat } from './formats/detectWorkoutFileFormat';

/** What a row of a Strong workouts export holds. */
export type StrongRowContent =
  /** A set. `order` is the raw "Set Order" value, e.g. "1", "W", "D", "F". */
  | { readonly kind: 'set'; readonly order: string }
  /** A note attached to the exercise (newer exports only). */
  | { readonly kind: 'note' }
  /** A rest-timer entry (newer exports only). Not imported. */
  | { readonly kind: 'restTimer' };

/**
 * One normalized workout-export row, with values parsed but weights still in the export unit.
 * Strong uses per-exercise inference; other adapters supply explicit units and provenance.
 */
export interface StrongRow {
  /** Adapter provenance; absent for legacy Strong rows so their keys remain unchanged. */
  readonly sourceFormat?: Exclude<WorkoutFileFormat, 'unknown'>;
  /** Explicit adapter column unit; absent for Strong's existing per-exercise inference. */
  readonly exportUnit?: WeightUnit;
  /**
   * The row's position in the file, counting the header as line 1 and not counting blank lines.
   * It is also the row's identifier in the typo review. For files with multi-line quoted values
   * it can differ from the physical line (the native app behaved the same way).
   */
  readonly line: number;
  /**
   * The adapter's workout grouping key. Strong keeps the exact exported start timestamp,
   * Hevy keeps start_time, FitNotes uses its date, and Fitbod uses its start minute or date.
   */
  readonly workoutKey: string;
  /** The start instant as a UTC ISO 8601 timestamp (the export's local time, converted). */
  readonly startedAt: string;
  readonly workoutName: string;
  /** Session length in seconds, if exported. */
  readonly durationSeconds: number | null;
  readonly exerciseName: string;
  readonly content: StrongRowContent;
  /** The weight number exactly as exported, in the exercise's export unit. */
  readonly weightValue: number;
  readonly reps: number;
  readonly rpe: number | null;
  readonly distanceMeters: number | null;
  readonly seconds: number | null;
  readonly notes: string | null;
  readonly workoutNotes: string | null;
}
