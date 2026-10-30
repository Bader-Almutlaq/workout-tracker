/** Reasons an exercise edit or merge cannot be completed. */
export type ExerciseEditErrorKind =
  | 'emptyName'
  | 'nameInUse'
  | 'noPrimaryMuscle'
  | 'notFound'
  | 'libraryExerciseIsReadOnly'
  | 'mergeIntoItself';

/** An exercise edit failure with a message suitable for the owner. */
export class ExerciseEditError extends Error {
  constructor(readonly kind: ExerciseEditErrorKind, name = '') {
    const messages: Record<ExerciseEditErrorKind, string> = {
      emptyName: 'Give the exercise a name.',
      nameInUse: `An exercise called “${name}” already exists.`,
      noPrimaryMuscle: 'Pick at least one primary muscle.',
      notFound: 'That exercise no longer exists.',
      libraryExerciseIsReadOnly: 'Built-in exercises can’t be edited. Duplicate it to make your own version.',
      mergeIntoItself: 'An exercise can’t be merged into itself.',
    };
    super(messages[kind]);
    this.name = 'ExerciseEditError';
  }
}
