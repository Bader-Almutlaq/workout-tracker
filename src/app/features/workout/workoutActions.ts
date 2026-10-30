import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { SetKind } from '../../../core/models/SetKind';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import { WorkoutLoggerError } from '../../../core/logging/WorkoutLoggerError';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { database } from '../../data/database';
import { dropboxBackup } from '../../data/dropbox/cloudBackup';
import type { Cell } from './Cell';
import { loggingQueue } from './loggingQueue';
import { setValuesOf, withTypedValue, type SetValues } from './setValues';
import { typoPromptFor, type TypoPrompt } from './typoPrompt';
import { workoutNameAt } from './workoutName';

/** A typed value that can't be saved (for example an RPE between the half steps). Its message is shown to the owner. */
class TypedValueError extends Error {
  override readonly name = 'TypedValueError';
}

/**
 * The saved set with `setId`. Read inside the queue, so every write queued before it is already
 * in it: the screen's copy may still be waiting for the last write to arrive.
 */
async function savedSet(workoutId: number, setId: number): Promise<WorkoutSet> {
  const detail = await database.workoutDetail(workoutId);
  const set = detail?.entries.flatMap((entry) => entry.sets).find((candidate) => candidate.id === setId);
  if (set === undefined) throw new WorkoutLoggerError('setNotFound');
  return set;
}

/** Writes `values` over the set. */
function updateSet(setId: number, values: SetValues): Promise<void> {
  return database.updateSet(
    setId,
    values.weightKilograms,
    values.entryUnit,
    values.reps,
    values.rpe,
    values.kind,
    values.durationSeconds,
  );
}

/**
 * Changes one set, starting from what is saved *at the moment the write runs*. `updateSet` replaces
 * every field, so building it from the on-screen set could undo a change still waiting in the queue
 * (weight typed, then reps typed before the weight's write shows up on screen).
 */
function editSet(workoutId: number, setId: number, change: (values: SetValues) => SetValues): void {
  void loggingQueue.enqueue(async () => {
    const stored = await savedSet(workoutId, setId);
    await updateSet(setId, change(setValuesOf(stored)));
  });
}

/** Starts a workout named for the time of day, with no exercises. Resolves when it has started (or failed). */
export function startEmptyWorkout(now: Date = new Date()): Promise<unknown> {
  return loggingQueue.enqueue(() => database.startWorkout(workoutNameAt(now), []));
}

/**
 * Starts a workout with `pastWorkoutId`'s name and the same exercises in the same order (skipping
 * any since archived). Sets are pre-filled from each exercise's last session by the logger.
 */
export function repeatWorkout(pastWorkoutId: number): Promise<unknown> {
  return loggingQueue.enqueue(async () => {
    const detail = await database.workoutDetail(pastWorkoutId);
    if (detail === undefined) throw new WorkoutLoggerError('workoutNotFound');
    const exerciseIds = detail.entries
      .filter(({ exercise }) => !exercise.isArchived)
      .map(({ exercise }) => exercise.id);
    await database.startWorkout(detail.workout.name, exerciseIds);
  });
}

/** Appends the exercises, in the given order, each pre-filled from its last session. */
export function addExercises(workoutId: number, exerciseIds: readonly number[]): Promise<unknown> {
  return loggingQueue.enqueue(() => database.addExercises(workoutId, exerciseIds));
}

/** Saves what was typed into a cell (`null` for empty). A value that can't be saved is reported in the banner. */
export function saveCell(workoutId: number, cell: Cell, typed: number | null, tracking: ExerciseTracking): void {
  editSet(workoutId, cell.setId, (values) => {
    const edit = withTypedValue(values, cell.field, typed, tracking);
    if (!edit.isValid) throw new TypedValueError(edit.message);
    return edit.values;
  });
}

/** Changes a set between working, warm-up, drop and failure. */
export function setSetKind(workoutId: number, setId: number, kind: SetKind): void {
  editSet(workoutId, setId, (values) => ({ ...values, kind }));
}

/** Changes the unit a set was typed in, keeping its stored kilograms. */
export function setSetUnit(workoutId: number, setId: number, entryUnit: WeightUnit): void {
  editSet(workoutId, setId, (values) => ({ ...values, entryUnit }));
}

/** Appends a planned set to the exercise. */
export function addSet(entryId: number): void {
  void loggingQueue.enqueue(() => database.addSet(entryId));
}

/** Deletes a set. */
export function deleteSet(setId: number): void {
  void loggingQueue.enqueue(() => database.deleteSet(setId));
}

/** Switches the exercise to `unit` for its planned sets (and next time). */
export function switchUnit(entryId: number, unit: WeightUnit): void {
  void loggingQueue.enqueue(() => database.setEntryUnit(unit, entryId));
}

/** Moves the exercise to a zero-based position in the workout. */
export function moveExercise(entryId: number, newPosition: number): void {
  void loggingQueue.enqueue(() => database.moveExercise(entryId, newPosition));
}

/** Removes the exercise and its sets from the workout. */
export function removeExercise(entryId: number): void {
  void loggingQueue.enqueue(() => database.removeExercise(entryId));
}

/** Renames the workout, keeping its notes. */
export function renameWorkout(workoutId: number, name: string, notes: string | null): void {
  void loggingQueue.enqueue(() => database.updateWorkout(workoutId, name, notes));
}

/** Deletes the workout in progress. */
export function discardWorkout(workoutId: number): void {
  void loggingQueue.enqueue(() => database.discardWorkout(workoutId));
}

/** Finishes the workout. Resolves to the id of the saved workout, `null` when nothing was completed, or `undefined` if it failed. */
export function finishWorkout(workoutId: number): Promise<number | null | undefined> {
  return loggingQueue.enqueue(async () => {
    const { workoutId: savedId } = await database.finishWorkout(workoutId);
    if (savedId !== null) void dropboxBackup.afterWorkout();
    return savedId;
  });
}

/** Marks the set done (recording the rest since the previous one). */
export function completeSet(setId: number): void {
  void loggingQueue.enqueue(() => database.setCompleted(setId, true));
}

/** Marks the set not done. */
export function clearSet(setId: number): void {
  void loggingQueue.enqueue(() => database.setCompleted(setId, false));
}

/**
 * Completes the set unless its numbers look like a typo, in which case `onSuspicious` gets the
 * prompt to show and the set stays planned. A set with no reps is still being typed, so it is not
 * checked. The check runs inside the queue, after any edit made just before the tap.
 */
export function completeCheckedSet(
  workoutId: number,
  exerciseId: number,
  setId: number,
  onSuspicious: (prompt: TypoPrompt) => void,
): void {
  void loggingQueue.enqueue(async () => {
    const set = await savedSet(workoutId, setId);
    if (set.reps > 0) {
      const finding = await database.liveSetFinding(exerciseId, set.weightKilograms, set.reps, set.kind, workoutId);
      if (finding !== null) {
        onSuspicious(typoPromptFor(finding, set));
        return;
      }
    }
    await database.setCompleted(setId, true);
  });
}

/** Remembers the rest target for the exercise, in seconds. */
export function setRestTarget(exerciseId: number, seconds: number): void {
  void loggingQueue.enqueue(() => database.setRestTarget(exerciseId, seconds));
}
