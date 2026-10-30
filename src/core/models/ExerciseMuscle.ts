/**
 * Links an exercise to a muscle it trains, with its role. Table `exerciseMuscle`.
 *
 * `muscleId` and `role` are plain strings here: the muscle taxonomy and role enum belong to the
 * library (W2), which will narrow these types when they are ported.
 */
export interface ExerciseMuscle {
  readonly exerciseId: number;
  /** Stable muscle slug, e.g. `rear-delt`; a key of the `muscle` table. */
  readonly muscleId: string;
  /** `primary` or `secondary`. */
  readonly role: string;
}

/** A raw `exerciseMuscle` row as SQLite returns it. */
export type ExerciseMuscleRow = ExerciseMuscle;

/** Converts a raw `exerciseMuscle` row to an `ExerciseMuscle`. */
export function fromExerciseMuscleRow(row: ExerciseMuscleRow): ExerciseMuscle {
  return { exerciseId: row.exerciseId, muscleId: row.muscleId, role: row.role };
}
