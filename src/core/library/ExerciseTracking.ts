/** Every kind of set an exercise can record. Values match the `exercise.tracking` CHECK constraint. */
export const EXERCISE_TRACKINGS = ['weight-reps', 'bodyweight-reps', 'duration', 'weight-duration'] as const;

/**
 * What a set of an exercise records. Stored in `exercise.tracking`. The logging screen shows the
 * fields that match.
 *
 * - `weight-reps`: weight and reps. The default.
 * - `bodyweight-reps`: reps, with optional added (weighted) or removed (assisted) load.
 * - `duration`: a timed hold, such as a plank.
 * - `weight-duration`: a loaded hold or carry, weight and time.
 */
export type ExerciseTracking = (typeof EXERCISE_TRACKINGS)[number];

/** Name of each tracking kind shown in the UI. */
export const EXERCISE_TRACKING_DISPLAY_NAMES: Readonly<Record<ExerciseTracking, string>> = {
  'weight-reps': 'Weight and reps',
  'bodyweight-reps': 'Bodyweight reps',
  duration: 'Duration',
  'weight-duration': 'Weight and duration',
};
