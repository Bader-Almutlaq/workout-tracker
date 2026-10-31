import type { DeloadStage } from '../logging/DeloadPlan';

/** An exercise as performed within one workout, at a position in the session. Table `workoutExercise`. */
export interface WorkoutExercise {
  readonly id: number;
  readonly workoutId: number;
  readonly exerciseId: number;
  /** 0-based order within the workout. Used for exercise-order analytics. */
  readonly position: number;
  /** Exercises sharing a group number were done as a superset. */
  readonly supersetGroup: number | null;
  readonly notes: string | null;
  /** Manufacturer, or null when not recorded. */
  readonly machineBrand?: string | null;
  /** Saved stage; absent only in older in-memory callers, NULL for normal database rows. */
  readonly deloadStage?: DeloadStage | null;
}

/** A raw `workoutExercise` row as SQLite returns it. */
export type WorkoutExerciseRow = WorkoutExercise;

/** Converts a raw `workoutExercise` row to a `WorkoutExercise`. */
export function fromWorkoutExerciseRow(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutId: row.workoutId,
    exerciseId: row.exerciseId,
    position: row.position,
    supersetGroup: row.supersetGroup,
    notes: row.notes,
    machineBrand: row.machineBrand ?? null,
    deloadStage: row.deloadStage ?? null,
  };
}
