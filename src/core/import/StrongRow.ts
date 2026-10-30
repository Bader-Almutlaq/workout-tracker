/** What a row of a Strong workouts export holds. */
export type StrongRowContent =
  /** A set. `order` is the raw "Set Order" value, e.g. "1", "W", "D", "F". */
  | { readonly kind: 'set'; readonly order: string }
  /** A note attached to the exercise (newer exports only). */
  | { readonly kind: 'note' }
  /** A rest-timer entry (newer exports only). Not imported. */
  | { readonly kind: 'restTimer' };

/**
 * One data row of a Strong workouts export, with values parsed but not yet interpreted (weights
 * are still in the export's per-exercise unit).
 */
export interface StrongRow {
  /**
   * The row's position in the file, counting the header as line 1 and not counting blank lines.
   * It is also the row's identifier in the typo review. For files with multi-line quoted values
   * it can differ from the physical line (the native app behaved the same way).
   */
  readonly line: number;
  /**
   * The workout's start timestamp exactly as exported, e.g. "2021-11-20 20:53:38". Strong has no
   * workout ID in older exports, so this identifies the workout.
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
