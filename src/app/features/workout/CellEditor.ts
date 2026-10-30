import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { Cell, Field } from './Cell';
import type { PadKey } from './PadKey';

/** The cell the number pad is typing into, with the set and exercise it belongs to. */
export interface EditedCell {
  readonly cell: Cell;
  readonly entry: LiveWorkoutEntry;
  readonly set: WorkoutSet;
  /** What the cell shows while it is edited: what was typed, or the saved value before the first key. */
  readonly text: string;
}

/** The state of the number pad and what its keys do. */
export interface CellEditor {
  /** The cell being edited, or `undefined` when the pad is closed (or its set is gone). */
  readonly editing: EditedCell | undefined;
  /** Opens the pad on a cell, saving the cell it was on before. */
  begin(setId: number, field: Field): void;
  /** Types a key into the cell. */
  press(key: PadKey): void;
  /** Moves the value one step up (`1`) or down (`-1`). */
  step(direction: 1 | -1): void;
  /** Saves the cell and moves to the next: weight, reps, RPE, then the next row's weight. Closes the pad after the last cell. */
  next(): void;
  /** Saves what was typed, keeping the pad open on the same cell showing the saved value. */
  commit(): void;
  /** Saves what was typed and closes the pad. */
  close(): void;
  /** Closes the pad without saving, because the set it was on is being deleted. */
  forget(setId: number): void;
}
