/** The three editable cells of a set row. `reps` holds seconds for timed exercises. */
export type Field = 'weight' | 'reps' | 'rpe';

/** One editable cell: a field of one set. */
export interface Cell {
  readonly setId: number;
  readonly field: Field;
}

/** Whether two cells are the same field of the same set. */
export function isSameCell(left: Cell, right: Cell): boolean {
  return left.setId === right.setId && left.field === right.field;
}
