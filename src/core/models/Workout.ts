import type { RecordSource } from './RecordSource';

/** One training session. Table `workout`. */
export interface Workout {
  readonly id: number;
  /** UTC ISO 8601 timestamp. */
  readonly startedAt: string;
  /** UTC ISO 8601 timestamp; `null` while the workout is in progress. */
  readonly endedAt: string | null;
  readonly name: string;
  readonly notes: string | null;
  /** `app` or `strong`. */
  readonly source: RecordSource;
  /**
   * Identifies the workout in its source, e.g. "strong:2021-11-20 20:53:38".
   * Unique, so importing the same file twice adds nothing.
   */
  readonly sourceKey: string | null;
  /** `true` while the workout is being logged. At most one workout is in progress. */
  readonly isInProgress: boolean;
}

/** A raw `workout` row as SQLite returns it: `isInProgress` is a 0/1 integer. */
export interface WorkoutRow extends Omit<Workout, 'isInProgress'> {
  readonly isInProgress: number;
}

/** Converts a raw `workout` row to a `Workout` (the 0/1 integer becomes a boolean). */
export function fromWorkoutRow(row: WorkoutRow): Workout {
  return { ...row, isInProgress: row.isInProgress === 1 };
}
