import { estimatedOneRepMax } from '../analytics/EstimatedOneRepMax';
import type { Database } from '../db/Database';
import type { Exercise } from '../models/Exercise';
import type { WorkoutSet } from '../models/WorkoutSet';
import { countWorkoutSets, workoutDetail, type WorkoutDetail } from './WorkoutHistory';

/** Comparable totals and top sets for two finished workouts; volumes are in kg. */
export interface WorkoutComparison {
  readonly previous: WorkoutDetail;
  readonly current: WorkoutDetail;
  readonly previousSetCount: number;
  readonly currentSetCount: number;
  readonly previousVolume: number;
  readonly currentVolume: number;
  readonly exercises: readonly {
    readonly exercise: Exercise;
    readonly previous: WorkoutSet | null;
    readonly current: WorkoutSet | null;
    readonly previousEstimate: number | null;
    readonly currentEstimate: number | null;
  }[];
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

function workSets(detail: WorkoutDetail): WorkoutSet[] {
  return detail.entries.flatMap((entry) => entry.sets.filter((set) => set.isCompleted && set.kind !== 'warmup'));
}
function top(sets: readonly WorkoutSet[]): WorkoutSet | null {
  return [...sets].sort((a, b) => b.weightKilograms - a.weightKilograms || b.reps - a.reps)[0] ?? null;
}
function volume(sets: readonly WorkoutSet[]): number {
  return sets.reduce((sum, set) => sum + set.weightKilograms * set.reps, 0);
}

/** The latest strictly earlier finished workout with the same template, or the same name without a template. */
export function workoutComparison(db: Database, workoutId: number): WorkoutComparison | null {
  const current = workoutDetail(db, workoutId);
  if (current === undefined || current.workout.isInProgress) return null;
  const id = db.value<number>(
    `
    SELECT id FROM workout WHERE isInProgress = 0 AND startedAt < ?
      AND ((? IS NOT NULL AND templateId = ?) OR (? IS NULL AND name = ?))
    ORDER BY startedAt DESC, id DESC LIMIT 1
  `,
    [
      current.workout.startedAt,
      current.workout.templateId,
      current.workout.templateId,
      current.workout.templateId,
      current.workout.name,
    ],
  );
  if (id === undefined) return null;
  const previous = workoutDetail(db, id);
  if (previous === undefined) return null;
  const before = workSets(previous);
  const now = workSets(current);
  const previousIds = new Set(previous.entries.map((entry) => entry.exercise.id));
  const currentIds = new Set(current.entries.map((entry) => entry.exercise.id));
  const exercises = current.entries
    .filter(({ exercise }) => previousIds.has(exercise.id))
    .map(({ exercise }) => {
      const old = top(
        previous.entries
          .filter((entry) => entry.exercise.id === exercise.id)
          .flatMap((entry) => entry.sets.filter((set) => set.isCompleted && set.kind !== 'warmup')),
      );
      const recent = top(
        current.entries
          .filter((entry) => entry.exercise.id === exercise.id)
          .flatMap((entry) => entry.sets.filter((set) => set.isCompleted && set.kind !== 'warmup')),
      );
      return {
        exercise,
        previous: old,
        current: recent,
        previousEstimate: old === null ? null : (estimatedOneRepMax(old, exercise)?.e1rmKilograms ?? null),
        currentEstimate: recent === null ? null : (estimatedOneRepMax(recent, exercise)?.e1rmKilograms ?? null),
      };
    });
  return {
    previous,
    current,
    previousSetCount: countWorkoutSets(before).setCount,
    currentSetCount: countWorkoutSets(now).setCount,
    previousVolume: volume(before),
    currentVolume: volume(now),
    exercises,
    added: current.entries.filter(({ exercise }) => !previousIds.has(exercise.id)).map(({ exercise }) => exercise.name),
    removed: previous.entries
      .filter(({ exercise }) => !currentIds.has(exercise.id))
      .map(({ exercise }) => exercise.name),
  };
}
