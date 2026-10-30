import type { SetKind } from '../../../core/models/SetKind';
import type { TemplateDraft, TemplateExerciseDraft, TemplateSetDraft } from '../../../core/templates/TemplateDraft';
import { TARGET_FIELDS, type TargetCell, type TargetField } from './TargetCell';

/** A set with no targets: the owner decides every number. */
export const BLANK_SET: TemplateSetDraft = {
  kind: 'working',
  targetRepsLow: null,
  targetRepsHigh: null,
  targetRpe: null,
};

/** The order a tap on a set's kind steps through, wrapping around. */
const KIND_CYCLE: readonly SetKind[] = ['working', 'warmup', 'drop', 'failure'];

function withExercise(
  draft: TemplateDraft,
  exerciseIndex: number,
  change: (exercise: TemplateExerciseDraft) => TemplateExerciseDraft,
): TemplateDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, index) => (index === exerciseIndex ? change(exercise) : exercise)),
  };
}

function withSet(
  draft: TemplateDraft,
  exerciseIndex: number,
  setIndex: number,
  change: (set: TemplateSetDraft) => TemplateSetDraft,
): TemplateDraft {
  return withExercise(draft, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, index) => (index === setIndex ? change(set) : set)),
  }));
}

/** Appends a set to the exercise that copies the last one's kind and targets (a blank set when there is none). */
export function withSetAdded(draft: TemplateDraft, exerciseIndex: number): TemplateDraft {
  return withExercise(draft, exerciseIndex, (exercise) => ({
    ...exercise,
    sets: [...exercise.sets, exercise.sets.at(-1) ?? BLANK_SET],
  }));
}

/** Removes a set. An exercise always keeps at least one set, so removing its only set changes nothing. */
export function withSetRemoved(draft: TemplateDraft, exerciseIndex: number, setIndex: number): TemplateDraft {
  return withExercise(draft, exerciseIndex, (exercise) =>
    exercise.sets.length <= 1
      ? exercise
      : { ...exercise, sets: exercise.sets.filter((_, index) => index !== setIndex) },
  );
}

/** The kind after `kind` in Working → Warm-up → Drop → Failure → Working. */
export function nextKind(kind: SetKind): SetKind {
  const position = KIND_CYCLE.indexOf(kind);
  return KIND_CYCLE[(position + 1) % KIND_CYCLE.length] ?? 'working';
}

/** Steps a set's kind to the next one in the cycle. */
export function withKindCycled(draft: TemplateDraft, exerciseIndex: number, setIndex: number): TemplateDraft {
  return withSet(draft, exerciseIndex, setIndex, (set) => ({ ...set, kind: nextKind(set.kind) }));
}

/** The number a cell holds, or `null` when the owner left it empty (or the cell doesn't exist). */
export function targetValue(draft: TemplateDraft, cell: TargetCell): number | null {
  const set = draft.exercises[cell.exerciseIndex]?.sets[cell.setIndex];
  if (set === undefined) return null;
  switch (cell.field) {
    case 'repsLow':
      return set.targetRepsLow;
    case 'repsHigh':
      return set.targetRepsHigh;
    case 'rpe':
      return set.targetRpe;
  }
}

function withField(set: TemplateSetDraft, field: TargetField, value: number | null): TemplateSetDraft {
  switch (field) {
    case 'repsLow':
      return { ...set, targetRepsLow: value };
    case 'repsHigh':
      return { ...set, targetRepsHigh: value };
    case 'rpe':
      return { ...set, targetRpe: value };
  }
}

/** Writes a number (`null` to clear it) into a cell. Whether it is valid is for the template store to say when saving. */
export function withTarget(draft: TemplateDraft, cell: TargetCell, value: number | null): TemplateDraft {
  return withSet(draft, cell.exerciseIndex, cell.setIndex, (set) => withField(set, cell.field, value));
}

/**
 * The cell after `cell` for the pad's Next key: low reps, high reps, RPE, then the next set's low
 * reps, then the next exercise's first set. `undefined` after the last cell.
 */
export function nextTargetCell(draft: TemplateDraft, cell: TargetCell): TargetCell | undefined {
  const fieldPosition = TARGET_FIELDS.indexOf(cell.field);
  const nextField = TARGET_FIELDS[fieldPosition + 1];
  if (nextField !== undefined) return { ...cell, field: nextField };
  const exercise = draft.exercises[cell.exerciseIndex];
  if (exercise === undefined) return undefined;
  const firstField = TARGET_FIELDS[0];
  if (firstField === undefined) return undefined;
  if (cell.setIndex + 1 < exercise.sets.length)
    return { exerciseIndex: cell.exerciseIndex, setIndex: cell.setIndex + 1, field: firstField };
  if (cell.exerciseIndex + 1 < draft.exercises.length)
    return { exerciseIndex: cell.exerciseIndex + 1, setIndex: 0, field: firstField };
  return undefined;
}
