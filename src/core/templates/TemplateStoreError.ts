/** A template action that could not be completed. */
export class TemplateStoreError extends Error {
  constructor(
    readonly kind:
      'emptyName' | 'noExercises' | 'noSets' | 'invalidReps' | 'invalidRpe' | 'notFound' | 'workoutNotFinished',
  ) {
    const messages = {
      emptyName: 'Give it a name.',
      noExercises: 'Add at least one exercise.',
      noSets: 'Add at least one set to each exercise.',
      invalidReps: 'Enter a valid rep range.',
      invalidRpe: 'RPE must be between 1 and 10.',
      notFound: 'That template or folder no longer exists.',
      workoutNotFinished: 'Choose a finished workout.',
    };
    super(messages[kind]);
    this.name = 'TemplateStoreError';
  }
}
