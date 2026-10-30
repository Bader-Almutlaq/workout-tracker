import type { Database } from '../db/Database';
import { fromExerciseRow, type Exercise, type ExerciseRow } from '../models/Exercise';
import { fromWorkoutRow, type Workout, type WorkoutRow } from '../models/Workout';
import { fromWorkoutExerciseRow, type WorkoutExercise, type WorkoutExerciseRow } from '../models/WorkoutExercise';
import { fromWorkoutSetRow, type WorkoutSet, type WorkoutSetRow } from '../models/WorkoutSet';

/** One row in the history list. */
export interface WorkoutSummary {
  readonly id: number;
  /** UTC ISO 8601 timestamp. */
  readonly startedAt: string;
  /** UTC ISO 8601 timestamp; `null` for a finished workout saved without an end time. */
  readonly endedAt: string | null;
  readonly name: string;
  readonly exerciseCount: number;
  /** Non-warm-up sets. */
  readonly setCount: number;
  /** Warm-up sets, shown separately. */
  readonly warmupCount?: number;
  /**
   * Tonnage: Σ weight × reps over non-warm-up sets, in kg. Secondary "work done" figure only;
   * it doesn't predict hypertrophy (Refalo 2023).
   */
  readonly volumeKilograms: number;
}

/** Counts non-warm-up and warm-up sets separately; drop and failure sets count as work. */
export function countWorkoutSets(sets: readonly { readonly kind: string }[]): {
  setCount: number;
  warmupCount: number;
} {
  let setCount = 0;
  let warmupCount = 0;
  for (const set of sets) {
    if (set.kind === 'warmup') warmupCount += 1;
    else setCount += 1;
  }
  return { setCount, warmupCount };
}

/** One exercise of a workout with its sets, in logged order. */
export interface WorkoutDetailEntry {
  readonly entry: WorkoutExercise;
  readonly exercise: Exercise;
  readonly sets: readonly WorkoutSet[];
}

/** A workout with its exercises and sets, in logged order. */
export interface WorkoutDetail {
  readonly workout: Workout;
  readonly entries: readonly WorkoutDetailEntry[];
}

/**
 * The one definition of a workout summary (counts and volume load), filtered by `condition`.
 * `endedAt` is a plain column of `workout`, so it is safe to select next to the grouped id.
 */
function summarySql(condition: string): string {
  return `
    SELECT w.id, w.startedAt, w.endedAt, w.name,
           COUNT(DISTINCT we.id) AS exerciseCount,
           COALESCE(SUM(CASE WHEN s.kind <> 'warmup' THEN s.weightKilograms * s.reps END), 0) AS volumeKilograms
    FROM workout w
    LEFT JOIN workoutExercise we ON we.workoutId = w.id
    LEFT JOIN workoutSet s ON s.workoutExerciseId = we.id
    WHERE ${condition}
    GROUP BY w.id
    ORDER BY w.startedAt DESC`;
}

/** `?, ?, ?` for `count` parameters. */
function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

function summariesWithCounts(db: Database, condition: string, workoutId?: number): WorkoutSummary[] {
  const parameters = workoutId === undefined ? [] : [workoutId];
  const summaries = db.all<Omit<WorkoutSummary, 'setCount' | 'warmupCount'>>(summarySql(condition), parameters);
  const rows = db.all<{ workoutId: number; kind: string }>(
    `SELECT w.id AS workoutId, s.kind FROM workout w
     JOIN workoutExercise we ON we.workoutId = w.id
     JOIN workoutSet s ON s.workoutExerciseId = we.id
     WHERE ${condition}`,
    parameters,
  );
  const setsByWorkout = new Map<number, { kind: string }[]>();
  for (const row of rows) {
    const sets = setsByWorkout.get(row.workoutId) ?? [];
    sets.push(row);
    setsByWorkout.set(row.workoutId, sets);
  }
  return summaries.map((summary) => ({ ...summary, ...countWorkoutSets(setsByWorkout.get(summary.id) ?? []) }));
}

/**
 * All finished workouts, newest first. The workout in progress is excluded: the logging screen
 * shows it (`LiveWorkout`).
 */
export function workoutSummaries(db: Database): WorkoutSummary[] {
  return summariesWithCounts(db, 'w.isInProgress = 0');
}

/** The summary of one finished workout, or `undefined` if it doesn't exist or is still in progress. */
export function workoutSummary(db: Database, workoutId: number): WorkoutSummary | undefined {
  return summariesWithCounts(db, 'w.isInProgress = 0 AND w.id = ?', workoutId)[0];
}

/**
 * One workout in full, or `undefined` if it doesn't exist. Entries are ordered by position and
 * sets by position within their entry. Weights stay in kilograms with the unit they were typed
 * in (`WorkoutSet.entryUnit`); the screen converts for display.
 */
export function workoutDetail(db: Database, workoutId: number): WorkoutDetail | undefined {
  const workoutRow = db.get<WorkoutRow>('SELECT * FROM workout WHERE id = ?', [workoutId]);
  if (workoutRow === undefined) return undefined;
  const workout = fromWorkoutRow(workoutRow);

  const entries = db
    .all<WorkoutExerciseRow>('SELECT * FROM workoutExercise WHERE workoutId = ? ORDER BY position', [workoutId])
    .map(fromWorkoutExerciseRow);
  if (entries.length === 0) return { workout, entries: [] };

  const exercisesById = new Map(
    db
      .all<ExerciseRow>(
        `SELECT * FROM exercise WHERE id IN (${placeholders(entries.length)})`,
        entries.map((entry) => entry.exerciseId),
      )
      .map(fromExerciseRow)
      .map((exercise) => [exercise.id, exercise] as const),
  );
  const setsByEntryId = new Map<number, WorkoutSet[]>();
  const setRows = db.all<WorkoutSetRow>(
    `SELECT * FROM workoutSet WHERE workoutExerciseId IN (${placeholders(entries.length)})
     ORDER BY workoutExerciseId, position`,
    entries.map((entry) => entry.id),
  );
  for (const row of setRows) {
    const sets = setsByEntryId.get(row.workoutExerciseId) ?? [];
    sets.push(fromWorkoutSetRow(row));
    setsByEntryId.set(row.workoutExerciseId, sets);
  }

  return {
    workout,
    entries: entries.flatMap((entry) => {
      const exercise = exercisesById.get(entry.exerciseId);
      // The foreign key makes a missing exercise impossible; skipping mirrors the native query.
      return exercise === undefined ? [] : [{ entry, exercise, sets: setsByEntryId.get(entry.id) ?? [] }];
    }),
  };
}
