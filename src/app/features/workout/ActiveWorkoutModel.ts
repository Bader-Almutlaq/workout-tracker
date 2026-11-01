import type { DeloadSettings } from '../../../core/logging/DeloadPlan';
import type { LiveWorkoutSnapshot } from '../../../core/queries/LiveWorkout';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { CellEditor } from './CellEditor';
import type { Confirmation } from './confirmation';
import type { ExerciseCardActions } from './ExerciseCardActions';
import type { TypoPrompt } from './typoPrompt';

/** Everything the screen for the workout in progress needs: the pad, the cards' actions and the open questions. */
export interface ActiveWorkoutModel {
  readonly snapshot: LiveWorkoutSnapshot;
  readonly editor: CellEditor;
  readonly cardActions: ExerciseCardActions;
  /** The question waiting for an answer, if any. */
  readonly confirmation: Confirmation | undefined;
  /** A set the typo check flagged, waiting for "Save anyway" or "Fix". */
  readonly typoPrompt: TypoPrompt | undefined;
  readonly isRenaming: boolean;
  /** Changes a set's unit and the exercise's together, for the pad's kg/lb toggle. */
  switchEditedUnit(unit: WeightUnit): void;
  openAddExercise(): void;
  startRenaming(): void;
  /** Renames the workout; a blank name is ignored. */
  rename(name: string): void;
  cancelRenaming(): void;
  /** Starts stage 1 on every exercise currently shown. */
  deloadWorkout(settings?: DeloadSettings): void;
  requestDiscard(): void;
  requestFinish(): void;
  confirm(): void;
  cancelConfirmation(): void;
  saveFlaggedSetAnyway(): void;
  fixFlaggedSet(): void;
}
