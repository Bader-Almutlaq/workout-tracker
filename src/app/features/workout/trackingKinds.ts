import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';

/** Whether a set of this exercise has a weight cell. Timed holds without load do not. */
export function recordsWeight(tracking: ExerciseTracking): boolean {
  return tracking !== 'duration';
}

/** Whether the second cell holds seconds (shown as m:ss) rather than a rep count. */
export function recordsDuration(tracking: ExerciseTracking): boolean {
  return tracking === 'duration' || tracking === 'weight-duration';
}

/** Whether the weight is load added to the lifter's own bodyweight, so 0 reads as "BW". */
export function isBodyweightLoad(tracking: ExerciseTracking): boolean {
  return tracking === 'bodyweight-reps';
}
