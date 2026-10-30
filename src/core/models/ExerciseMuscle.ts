import type { Muscle } from '../library/Muscle';
import type { MuscleRole } from '../library/MuscleRole';

/** Links an exercise to a muscle it trains, with its role. Table `exerciseMuscle`. */
export interface ExerciseMuscle {
  readonly exerciseId: number;
  /** Stable muscle slug, e.g. `rear-delt`; a key of the `muscle` table. */
  readonly muscleId: Muscle;
  readonly role: MuscleRole;
}

/** A raw `exerciseMuscle` row as SQLite returns it. */
export type ExerciseMuscleRow = ExerciseMuscle;

/** Converts a raw `exerciseMuscle` row to an `ExerciseMuscle`. */
export function fromExerciseMuscleRow(row: ExerciseMuscleRow): ExerciseMuscle {
  return { exerciseId: row.exerciseId, muscleId: row.muscleId, role: row.role };
}
