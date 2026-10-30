/** The screen where exercises are picked for the workout in progress. */
export const ADD_EXERCISE_PATH = '/workout/add';

/** Where the summary of a finished workout is shown. */
export const SUMMARY_PATH = '/workout/summary';

/** The finish summary for `workoutId`, or the "nothing was logged" notice when the workout was discarded (`null`). */
export function summaryPath(workoutId: number | null): string {
  return workoutId === null ? SUMMARY_PATH : `${SUMMARY_PATH}/${workoutId}`;
}
