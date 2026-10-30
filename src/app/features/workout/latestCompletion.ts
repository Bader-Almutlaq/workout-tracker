import type { Exercise } from '../../../core/models/Exercise';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';

/** The set most recently completed in the workout, with the exercise it belongs to. */
export interface LatestCompletion {
  readonly exercise: Exercise;
  /** When the set was completed, as an ISO timestamp. */
  readonly completedAt: string;
}

/**
 * The completed set with the latest `completedAt` across all exercises, or `undefined` when no set is
 * completed yet. The rest timer counts from it.
 */
export function latestCompletion(entries: readonly LiveWorkoutEntry[]): LatestCompletion | undefined {
  let latest: LatestCompletion | undefined;
  for (const { exercise, sets } of entries) {
    for (const set of sets) {
      if (!set.isCompleted || set.completedAt === null) continue;
      if (latest === undefined || Date.parse(set.completedAt) > Date.parse(latest.completedAt))
        latest = { exercise, completedAt: set.completedAt };
    }
  }
  return latest;
}
