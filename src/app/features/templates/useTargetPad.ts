import { useState } from 'react';
import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import { draftTextFor, draftValue, startDraft, stepDraft, typeKey, type NumberDraft } from '../workout/numberDraft';
import { isSameTargetCell, type TargetCell } from './TargetCell';
import type { TargetPad } from './TargetPad';
import { targetPadRange } from './targetPadText';
import { nextTargetCell, targetValue, withTarget } from './templateSetEdits';

/** The cell being typed into and what has been typed so far. */
interface PadState {
  readonly cell: TargetCell;
  readonly typed: NumberDraft;
}

/**
 * The number pad for a template's targets. Unlike logging, there is nothing to save separately: each
 * key writes the number straight into the draft (an empty cell clears the target), and the template
 * is only stored when the owner presses Save.
 */
export function useTargetPad(draft: TemplateDraft, change: (next: TemplateDraft) => void): TargetPad {
  const [state, setState] = useState<PadState | undefined>(undefined);

  const open = (cell: TargetCell) => {
    if (state !== undefined && isSameTargetCell(state.cell, cell)) return;
    const value = targetValue(draft, cell);
    setState({ cell, typed: startDraft(value === null ? '' : draftTextFor(value)) });
  };

  const type = (edit: (typed: NumberDraft, cell: TargetCell) => NumberDraft) => {
    if (state === undefined) return;
    const typed = edit(state.typed, state.cell);
    setState({ cell: state.cell, typed });
    change(withTarget(draft, state.cell, draftValue(typed)));
  };

  return {
    editing: state === undefined ? undefined : { cell: state.cell, text: state.typed.text },
    begin: open,
    press: (key) => type((typed) => typeKey(typed, key)),
    step: (direction) =>
      type((typed, cell) => {
        const range = targetPadRange(cell.field);
        return stepDraft(typed, direction * range.step, range.minimum, range.maximum);
      }),
    next: () => {
      if (state === undefined) return;
      const target = nextTargetCell(draft, state.cell);
      if (target === undefined) setState(undefined);
      else open(target);
    },
    close: () => setState(undefined),
  };
}
