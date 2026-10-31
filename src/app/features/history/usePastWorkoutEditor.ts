import { useRef, useState } from 'react';
import type { LiveWorkoutSnapshot } from '../../../core/queries/LiveWorkout';
import { database } from '../../data/database';
import type { ExerciseCardActions } from '../workout/ExerciseCardActions';
import { loggingQueue } from '../workout/loggingQueue';
import type { TypoPrompt } from '../workout/typoPrompt';
import { useCellEditor } from '../workout/useCellEditor';
import * as actions from '../workout/workoutActions';

/** History uses the live editor and queue, but never clears completion, starts timers, or asks before removing rows. */
export function usePastWorkoutEditor(snapshot: LiveWorkoutSnapshot, onDone: () => void) {
  const [typoPrompt, setTypoPrompt] = useState<TypoPrompt | undefined>();
  const pendingPrompt = useRef(false);
  const editor = useCellEditor(snapshot, (prompt) => {
    pendingPrompt.current = true;
    setTypoPrompt(prompt);
  });
  const { workout, entries } = snapshot;
  const cardActions: ExerciseCardActions = {
    edit: editor.begin,
    // History sets are already performed; the shared card disables this button.
    toggleCompleted: () => undefined,
    selectKind: (setId, kind) => {
      editor.close();
      actions.setSetKind(workout.id, setId, kind);
    },
    deleteSet: (setId) => {
      editor.forget(setId);
      actions.deleteSet(setId);
    },
    addSet: (entryId, kind) => {
      editor.close();
      actions.addSet(entryId, kind);
    },
    switchUnit: (entryId, unit) => {
      editor.close();
      actions.switchUnit(entryId, unit);
    },
    move: (entryId, offset) => {
      editor.close();
      const index = entries.findIndex((entry) => entry.entry.id === entryId);
      actions.moveExercise(entryId, index + offset);
    },
    requestRemoval: (entry) => {
      editor.close();
      actions.removeExercise(entry.entry.id);
    },
  };
  const dismissPrompt = () => {
    pendingPrompt.current = false;
    setTypoPrompt(undefined);
  };
  return {
    editor,
    cardActions,
    typoPrompt,
    saveAnyway: dismissPrompt,
    fix: () => {
      if (typoPrompt !== undefined) editor.begin(typoPrompt.setId, typoPrompt.field);
      dismissPrompt();
    },
    switchEditedUnit: (unit: 'kg' | 'lb') => {
      const editing = editor.editing;
      if (editing === undefined) return;
      editor.commit();
      actions.switchUnit(editing.entry.entry.id, unit);
    },
    saveExerciseNotes: (entryId: number, notes: string) => {
      void loggingQueue.enqueue(() => database.updateWorkoutExerciseNotes(entryId, notes));
    },
    saveSetNotes: (setId: number, notes: string) => {
      void loggingQueue.enqueue(() => database.updateWorkoutSetNotes(setId, notes));
    },
    done: () => {
      editor.close();
      if (loggingQueue.errorMessage() !== undefined) return;
      // Drain writes (including the final cell's check) before unmounting this edit session.
      void loggingQueue
        .enqueue(async () => true)
        .then(() => {
          if (!pendingPrompt.current && loggingQueue.errorMessage() === undefined) onDone();
        });
    },
  };
}
