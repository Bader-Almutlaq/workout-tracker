/** Why a logging action could not be carried out. */
export class WorkoutLoggerError extends Error {
  constructor(
    readonly kind:
      | 'workoutAlreadyInProgress'
      | 'workoutNotFound'
      | 'exerciseNotFound'
      | 'setNotFound'
      | 'invalidReps'
      | 'invalidWeight'
      | 'invalidRPE',
    readonly value?: number,
  ) {
    const messages = {
      workoutAlreadyInProgress: 'A workout is already in progress. Finish or discard it first.',
      workoutNotFound: 'That workout no longer exists.',
      exerciseNotFound: 'That exercise no longer exists.',
      setNotFound: 'That set no longer exists.',
      invalidReps: `${value} isn’t a valid number of reps.`,
      invalidWeight: `${value} kg isn’t a valid weight.`,
      invalidRPE: `RPE must be between 1 and 10 (got ${value}).`,
    };
    super(messages[kind]);
    this.name = 'WorkoutLoggerError';
  }
}
