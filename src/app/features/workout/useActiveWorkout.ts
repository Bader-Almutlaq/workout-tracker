import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { LiveWorkoutEntry, LiveWorkoutSnapshot } from '../../../core/queries/LiveWorkout';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { ActiveWorkoutModel } from './ActiveWorkoutModel';
import type { Confirmation } from './confirmation';
import type { ExerciseCardActions } from './ExerciseCardActions';
import { plannedSetCount } from './liveWorkoutLookup';
import type { TypoPrompt } from './typoPrompt';
import { useCellEditor } from './useCellEditor';
import * as actions from './workoutActions';
import { ADD_EXERCISE_PATH, summaryPath } from './workoutPaths';

/**
 * State and actions behind the screen for the workout in progress. Every action is queued to the
 * database in tap order (`loggingQueue`) and the screen changes only when the new state arrives, so
 * what is shown is what is saved. Any half-typed cell is saved first, so a tap never loses a number.
 */
export function useActiveWorkout(snapshot: LiveWorkoutSnapshot): ActiveWorkoutModel {
  const navigate = useNavigate();
  const editor = useCellEditor(snapshot);
  const [confirmation, setConfirmation] = useState<Confirmation | undefined>(undefined);
  const [typoPrompt, setTypoPrompt] = useState<TypoPrompt | undefined>(undefined);
  const [isRenaming, setIsRenaming] = useState(false);
  const { workout, entries } = snapshot;

  const finish = () => {
    editor.close();
    void actions.finishWorkout(workout.id).then((savedId) => {
      if (savedId !== undefined) navigate(summaryPath(savedId));
    });
  };

  const cardActions: ExerciseCardActions = {
    isValueEntered: editor.isValueEntered,
    applySuggestion: (setId, field, value) => editor.acceptSuggestion({ setId, field }, value),
    openExercise: (exerciseId) => {
      editor.close();
      navigate(`/exercises/${exerciseId}`);
    },
    saveNotes: (entryId, notes) => {
      editor.close();
      actions.saveExerciseNotes(entryId, notes);
    },
    setRestTarget: (exerciseId, seconds) => {
      editor.close();
      actions.setRestTarget(exerciseId, seconds);
    },
    edit: editor.begin,
    toggleCompleted: (entry: LiveWorkoutEntry, set) => {
      editor.close();
      if (set.isCompleted) actions.clearSet(set.id);
      else actions.completeCheckedSet(workout.id, entry.exercise.id, set.id, setTypoPrompt);
    },
    selectKind: (setId, kind) => {
      editor.close();
      actions.setSetKind(workout.id, setId, kind);
    },
    deleteSet: (setId) => {
      editor.forget(setId);
      actions.deleteSet(setId);
    },
    addSet: (entryId) => {
      editor.close();
      actions.addSet(entryId);
    },
    setMachineBrand: (entryId, brand) => {
      editor.close();
      actions.setMachineBrand(entryId, brand);
    },
    setDeload: (entryId, enabled) => {
      editor.close();
      actions.setDeload(entryId, enabled);
    },
    toggleWarmups: (entryId, remove) => {
      editor.close();
      actions.toggleWarmups(entryId, remove);
    },
    switchUnit: (entryId, unit) => {
      editor.close();
      actions.switchUnit(entryId, unit);
    },
    move: (entryId, offset) => {
      const index = entries.findIndex((entry) => entry.entry.id === entryId);
      editor.close();
      actions.moveExercise(entryId, index + offset);
    },
    requestRemoval: (entry) => {
      editor.close();
      if (entry.sets.some((set) => set.isCompleted))
        setConfirmation({ kind: 'removeExercise', entryId: entry.entry.id, name: entry.exercise.name });
      else actions.removeExercise(entry.entry.id);
    },
  };

  return {
    snapshot,
    editor,
    cardActions,
    confirmation,
    typoPrompt,
    isRenaming,
    switchEditedUnit: (unit: WeightUnit) => {
      const editing = editor.editing;
      if (editing === undefined) return;
      editor.commit();
      actions.switchUnit(editing.entry.entry.id, unit);
      if (editing.set.entryUnit !== unit) actions.setSetUnit(workout.id, editing.set.id, unit);
    },
    openAddExercise: () => {
      editor.close();
      navigate(ADD_EXERCISE_PATH);
    },
    startRenaming: () => {
      editor.close();
      setIsRenaming(true);
    },
    rename: (name) => {
      setIsRenaming(false);
      const trimmed = name.trim();
      if (trimmed !== '') actions.renameWorkout(workout.id, trimmed, workout.notes);
    },
    cancelRenaming: () => setIsRenaming(false),
    deloadWorkout: () => {
      editor.close();
      actions.deloadWorkout(workout.id);
    },
    requestDiscard: () => {
      editor.close();
      setConfirmation({ kind: 'discard' });
    },
    requestFinish: () => {
      editor.close();
      const plannedSets = plannedSetCount(entries);
      if (plannedSets > 0) setConfirmation({ kind: 'finish', plannedSets });
      else finish();
    },
    confirm: () => {
      const answered = confirmation;
      setConfirmation(undefined);
      if (answered === undefined) return;
      switch (answered.kind) {
        case 'discard':
          actions.discardWorkout(workout.id);
          break;
        case 'finish':
          finish();
          break;
        case 'removeExercise':
          actions.removeExercise(answered.entryId);
          break;
      }
    },
    cancelConfirmation: () => setConfirmation(undefined),
    saveFlaggedSetAnyway: () => {
      if (typoPrompt !== undefined) actions.completeSet(typoPrompt.setId);
      setTypoPrompt(undefined);
    },
    fixFlaggedSet: () => {
      if (typoPrompt !== undefined) editor.begin(typoPrompt.setId, typoPrompt.field);
      setTypoPrompt(undefined);
    },
  };
}
