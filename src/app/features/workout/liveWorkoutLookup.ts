import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';

/** Where a set sits in the workout on screen. */
export interface SetLocation {
  readonly entry: LiveWorkoutEntry;
  readonly set: WorkoutSet;
}

/** The set with `setId` and its exercise, or `undefined` when it is no longer in the workout. */
export function locateSet(entries: readonly LiveWorkoutEntry[], setId: number): SetLocation | undefined {
  for (const entry of entries) {
    const set = entry.sets.find((candidate) => candidate.id === setId);
    if (set !== undefined) return { entry, set };
  }
  return undefined;
}

/** How many sets are planned but not completed; finishing the workout discards them. */
export function plannedSetCount(entries: readonly Pick<LiveWorkoutEntry, 'sets'>[]): number {
  return entries.reduce((total, { sets }) => total + sets.filter((set) => !set.isCompleted).length, 0);
}
