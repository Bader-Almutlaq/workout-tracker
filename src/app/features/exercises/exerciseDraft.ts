import type { CustomExerciseDraft } from '../../../core/library/CustomExerciseDraft';
import type { Muscle } from '../../../core/library/Muscle';
import type { ExerciseCatalogDetail } from '../../../core/queries/ExerciseCatalog';

/** Appended to a duplicated exercise's name, as in the native app. */
const COPY_SUFFIX = ' (Copy)';

/**
 * The form fields of an existing exercise, to edit it or to start a duplicate from it.
 * A duplicate gets " (Copy)" after its name, because names must be unique.
 */
export function draftFromDetail(detail: ExerciseCatalogDetail, isCopy: boolean): CustomExerciseDraft {
  const { exercise } = detail;
  return {
    name: isCopy ? `${exercise.name}${COPY_SUFFIX}` : exercise.name,
    equipment: exercise.equipment,
    pattern: exercise.movementPattern,
    mechanic: exercise.mechanic,
    primaryMuscles: detail.primaryMuscles,
    secondaryMuscles: detail.secondaryMuscles,
    isLengthenedBiased: exercise.isLengthenedBiased,
    tracking: exercise.tracking,
    loadStepKilograms: exercise.loadStepKilograms ?? null,
    barWeightKilograms: exercise.barWeightKilograms ?? null,
    warmupSetCount: exercise.warmupSetCount ?? null,
  };
}

/** Whether the form can be saved: a name and at least one primary muscle (the core checks the rest). */
export function canSaveDraft(draft: CustomExerciseDraft): boolean {
  return (draft.name ?? '').trim().length > 0 && (draft.primaryMuscles ?? []).length > 0;
}

/** `values` with `value` removed when present, otherwise added at the end (the order tapped is kept). */
function toggled<Value>(values: readonly Value[], value: Value): Value[] {
  return values.includes(value) ? values.filter((existing) => existing !== value) : [...values, value];
}

/** The draft with `muscle` switched on or off as a primary muscle. A new primary muscle leaves the secondary list. */
export function withPrimaryToggled(draft: CustomExerciseDraft, muscle: Muscle): CustomExerciseDraft {
  const primaryMuscles = toggled(draft.primaryMuscles ?? [], muscle);
  const secondaryMuscles = (draft.secondaryMuscles ?? []).filter((existing) => !primaryMuscles.includes(existing));
  return { ...draft, primaryMuscles, secondaryMuscles };
}

/** The draft with `muscle` switched on or off as a secondary muscle. */
export function withSecondaryToggled(draft: CustomExerciseDraft, muscle: Muscle): CustomExerciseDraft {
  return { ...draft, secondaryMuscles: toggled(draft.secondaryMuscles ?? [], muscle) };
}
