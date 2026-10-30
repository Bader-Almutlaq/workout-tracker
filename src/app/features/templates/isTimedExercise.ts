import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';

/** Whether a template target is a duration in seconds. */
export function isTimedExercise(tracking: ExerciseTracking | undefined): boolean {
  return tracking === 'duration' || tracking === 'weight-duration';
}
