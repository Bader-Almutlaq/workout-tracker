import type { WeightUnit } from '../units/WeightUnit';
import type { SetKind } from './SetKind';
import type { SetSide } from './SetSide';

/** One set. Table `workoutSet`. */
export interface WorkoutSet {
  readonly id: number;
  readonly workoutExerciseId: number;
  /** 0-based order within the exercise. */
  readonly position: number;
  readonly kind: SetKind;
  /** Load in kilograms, exactly as entered or imported. 0 for bodyweight movements. */
  readonly weightKilograms: number;
  /** Unit the weight was typed in, for display. */
  readonly entryUnit: WeightUnit;
  readonly reps: number;
  /**
   * Rating of perceived exertion, 1–10 (half steps allowed). `null` = not logged.
   * RIR is derived as 10 − RPE (Zourdos 2016); it is never stored separately.
   */
  readonly rpe: number | null;
  readonly durationSeconds: number | null;
  readonly distanceMeters: number | null;
  readonly side: SetSide;
  /** Rest taken before this set, from the rest timer. `null` when unknown (all imported sets). */
  readonly restBeforeSeconds: number | null;
  /** UTC ISO 8601 timestamp. */
  readonly completedAt: string | null;
  /**
   * `false` while the set is only planned (pre-filled from last session) in a workout in progress.
   * Finishing the workout deletes sets that are still not completed.
   */
  readonly isCompleted: boolean;
  readonly notes: string | null;
}

/** A raw `workoutSet` row as SQLite returns it: `isCompleted` is a 0/1 integer. */
export interface WorkoutSetRow extends Omit<WorkoutSet, 'isCompleted'> {
  readonly isCompleted: number;
}

/** Converts a raw `workoutSet` row to a `WorkoutSet` (the 0/1 integer becomes a boolean). */
export function fromWorkoutSetRow(row: WorkoutSetRow): WorkoutSet {
  return { ...row, isCompleted: row.isCompleted === 1 };
}
