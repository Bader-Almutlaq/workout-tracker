import type { TargetCell } from './TargetCell';

/** What a tap in the template editor's exercise cards can do. Every index is a position in the draft. */
export interface TemplateEditorActions {
  /** Opens the number pad on a target. */
  edit(cell: TargetCell): void;
  addSet(exerciseIndex: number): void;
  removeSet(exerciseIndex: number, setIndex: number): void;
  /** Steps the set's kind: Working, Warm-up, Drop, Failure. */
  cycleKind(exerciseIndex: number, setIndex: number): void;
  move(exerciseIndex: number, direction: 1 | -1): void;
  /** Joins the exercise to the next one in a superset, or splits them if they already are one. */
  toggleSuperset(exerciseIndex: number): void;
  removeExercise(exerciseIndex: number): void;
}
