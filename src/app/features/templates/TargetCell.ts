/** The three numbers a template set can aim for, all optional and all written by the owner. */
export type TargetField = 'repsLow' | 'repsHigh' | 'rpe';

/** The fields in the order the pad's Next key visits them. */
export const TARGET_FIELDS: readonly TargetField[] = ['repsLow', 'repsHigh', 'rpe'];

/** One editable number of a template: a field of one set of one exercise, by position in the draft. */
export interface TargetCell {
  readonly exerciseIndex: number;
  readonly setIndex: number;
  readonly field: TargetField;
}

/** Whether two cells are the same field of the same set. */
export function isSameTargetCell(left: TargetCell, right: TargetCell): boolean {
  return left.exerciseIndex === right.exerciseIndex && left.setIndex === right.setIndex && left.field === right.field;
}
