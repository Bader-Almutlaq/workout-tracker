import type { SetKind } from '../../../core/models/SetKind';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { Field } from './Cell';

/** What the owner can do from an exercise card. Each one is a tap; the screen changes when the database does. */
export interface ExerciseCardActions {
  /** Opens the number pad on a cell. */
  edit(setId: number, field: Field): void;
  /** Completes a planned set (asking "Is this right?" first if it looks like a typo), or clears a completed one. */
  toggleCompleted(entry: LiveWorkoutEntry, set: WorkoutSet): void;
  selectKind(setId: number, kind: SetKind): void;
  deleteSet(setId: number): void;
  addSet(entryId: number): void;
  switchUnit(entryId: number, unit: WeightUnit): void;
  /** Adds or removes untouched suggested warm-ups in a live workout. */
  toggleWarmups?(entryId: number, remove: boolean): void;
  /** Moves the exercise up (`-1`) or down (`1`) one place. */
  move(entryId: number, offset: -1 | 1): void;
  /** Removes the exercise, asking first when it has completed sets. */
  requestRemoval(entry: LiveWorkoutEntry): void;
}
