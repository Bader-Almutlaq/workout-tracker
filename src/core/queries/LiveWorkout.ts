import type { Database } from '../db/Database';
import type { Workout } from '../models/Workout';
import type { WorkoutSet } from '../models/WorkoutSet';
import { workoutDetail, type WorkoutDetailEntry } from './WorkoutHistory';
import { previousPerformance } from './PreviousPerformance';

/** An exercise with planned and completed sets and the previous session's completed sets. */
export interface LiveWorkoutEntry extends WorkoutDetailEntry {
  readonly previous: readonly WorkoutSet[];
}

/** Plain data for the workout being logged, including previous performance. */
export interface LiveWorkoutSnapshot {
  readonly workout: Workout;
  readonly entries: readonly LiveWorkoutEntry[];
}

/** Returns a workout and previous performance, or undefined if the workout no longer exists. */
export function liveWorkoutSnapshot(db: Database, workoutId: number): LiveWorkoutSnapshot | undefined {
  const detail = workoutDetail(db, workoutId);
  if (detail === undefined) return undefined;
  return {
    workout: detail.workout,
    entries: detail.entries.map((item) => ({
      ...item,
      previous: previousPerformance(db, item.exercise.id, workoutId),
    })),
  };
}
