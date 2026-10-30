import type { PadKey } from '../workout/PadKey';
import type { TargetCell } from './TargetCell';

/** The number pad's state in the template editor and what its keys do. */
export interface TargetPad {
  /** The cell being typed into with the text it shows, or `undefined` when the pad is closed. */
  readonly editing: { readonly cell: TargetCell; readonly text: string } | undefined;
  /** Opens the pad on a cell. */
  begin(cell: TargetCell): void;
  /** Types a key into the cell. */
  press(key: PadKey): void;
  /** Moves the value one step up (`1`) or down (`-1`). */
  step(direction: 1 | -1): void;
  /** Moves to the next cell, closing the pad after the last one. */
  next(): void;
  /** Closes the pad. */
  close(): void;
}
