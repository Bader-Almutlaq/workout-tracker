/** What is wrong with the exercise library file. */
export type ExerciseLibraryErrorKind =
  /** The text is not JSON, or a field is missing or has the wrong type or an unknown value. */
  | 'malformed'
  /** Two exercises expand to the same name (and so the same key). */
  | 'duplicateName'
  /** An exercise lists no primary muscle. */
  | 'noPrimaryMuscle'
  /** An exercise lists the same muscle as both primary and secondary. */
  | 'muscleListedTwice';

/**
 * A problem with the bundled library file. These are programmer errors caught by the library
 * tests; at runtime they are logged and surfaced, never ignored.
 */
export class ExerciseLibraryError extends Error {
  override readonly name = 'ExerciseLibraryError';

  constructor(
    readonly kind: ExerciseLibraryErrorKind,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
}
