import type { TypoPrompt } from './typoPrompt';
import { useState } from 'react';
import type { LiveWorkoutSnapshot } from '../../../core/queries/LiveWorkout';
import { isSameCell, type Cell, type Field } from './Cell';
import type { CellEditor, EditedCell } from './CellEditor';
import { nextCell } from './cellOrder';
import { locateSet } from './liveWorkoutLookup';
import { draftHasChanged, draftValue, startDraft, stepDraft, typeKey, type NumberDraft } from './numberDraft';
import { padRange } from './padRange';
import { cellStartText } from './setCellText';
import { saveCell } from './workoutActions';

/** The cell being edited and the draft typed into it; no draft until the first key, so the cell shows the saved value. */
interface EditState {
  readonly cell: Cell;
  readonly typed: NumberDraft | undefined;
}

/**
 * The number pad's state for the workout on screen. The only local state is the cell being typed
 * into and its draft; a value is written when the owner moves to another cell or closes the pad,
 * not on every key. What the rows show always comes from the database. History supplies
 * `onSuspicious` to check edited weights and reps without changing completion.
 */
export function useCellEditor(snapshot: LiveWorkoutSnapshot, onSuspicious?: (prompt: TypoPrompt) => void): CellEditor {
  const [state, setState] = useState<EditState | undefined>(undefined);
  const location = state === undefined ? undefined : locateSet(snapshot.entries, state.cell.setId);
  const workoutId = snapshot.workout.id;

  let editing: EditedCell | undefined;
  let draft: NumberDraft | undefined;
  if (state !== undefined && location !== undefined) {
    const saved = cellStartText(location.set, state.cell.field, location.entry.exercise.tracking);
    draft = state.typed ?? startDraft(saved);
    editing = { cell: state.cell, entry: location.entry, set: location.set, text: draft.text };
  }

  const save = () => {
    if (editing === undefined || state?.typed === undefined || !draftHasChanged(state.typed)) return;
    saveCell(workoutId, editing.cell, draftValue(state.typed), editing.entry.exercise.tracking, onSuspicious);
  };

  const edit = (change: (current: NumberDraft, edited: EditedCell) => NumberDraft) => {
    if (editing === undefined || draft === undefined) return;
    setState({ cell: editing.cell, typed: change(draft, editing) });
  };

  return {
    editing,
    begin: (setId: number, field: Field) => {
      const cell: Cell = { setId, field };
      if (editing !== undefined && isSameCell(editing.cell, cell)) return;
      save();
      setState({ cell, typed: undefined });
    },
    press: (key) => edit((current) => typeKey(current, key)),
    step: (direction) =>
      edit((current, edited) => {
        const range = padRange(edited.cell.field, edited.set.entryUnit);
        return stepDraft(current, direction * range.step, range.minimum, range.maximum);
      }),
    next: () => {
      if (editing === undefined) return;
      save();
      const target = nextCell(snapshot.entries, editing.cell);
      setState(target === undefined ? undefined : { cell: target, typed: undefined });
    },
    commit: () => {
      save();
      setState((current) => (current === undefined ? undefined : { cell: current.cell, typed: undefined }));
    },
    close: () => {
      save();
      setState(undefined);
    },
    forget: (setId) => setState((current) => (current?.cell.setId === setId ? undefined : current)),
  };
}
