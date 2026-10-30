import type { SetKind } from '../../../core/models/SetKind';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import { toKilograms } from '../../../core/units/Weight';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { Field } from './Cell';
import { recordsDuration } from './trackingKinds';

/**
 * The fields `updateSet` takes, copied from a saved set so one change can leave the others as they
 * were: `updateSet` replaces every field.
 */
export interface SetValues {
  readonly weightKilograms: number;
  readonly entryUnit: WeightUnit;
  readonly reps: number;
  readonly rpe: number | null;
  readonly kind: SetKind;
  readonly durationSeconds: number | null;
}

/** The result of putting a typed number into a set: the new values, or why it can't be. */
export type TypedEdit =
  { readonly isValid: true; readonly values: SetValues } | { readonly isValid: false; readonly message: string };

/** The editable fields of a saved set. */
export function setValuesOf(set: WorkoutSet): SetValues {
  return {
    weightKilograms: set.weightKilograms,
    entryUnit: set.entryUnit,
    reps: set.reps,
    rpe: set.rpe,
    kind: set.kind,
    durationSeconds: set.durationSeconds,
  };
}

/** RPE is rated in half steps, so 7.3 is not a rating. */
function isHalfStep(value: number): boolean {
  return Number.isInteger(value * 2);
}

/**
 * `values` with `typed` (the number on the pad, `null` when empty) put into the cell of `field`.
 *
 * - Weight is typed in the set's own unit and stored as kilograms through `toKilograms`.
 * - Reps are whole numbers. For timed exercises the cell holds seconds and reps stay 0.
 * - RPE accepts half steps or empty; anything else is refused with a message before it reaches the core.
 */
export function withTypedValue(
  values: SetValues,
  field: Field,
  typed: number | null,
  tracking: ExerciseTracking,
): TypedEdit {
  switch (field) {
    case 'weight':
      return { isValid: true, values: { ...values, weightKilograms: toKilograms(typed ?? 0, values.entryUnit) } };
    case 'reps': {
      const whole = Math.round(typed ?? 0);
      return {
        isValid: true,
        values: recordsDuration(tracking) ? { ...values, durationSeconds: whole, reps: 0 } : { ...values, reps: whole },
      };
    }
    case 'rpe':
      if (typed === null) return { isValid: true, values: { ...values, rpe: null } };
      if (!isHalfStep(typed))
        return { isValid: false, message: `RPE goes in half steps, such as 7 or 7.5 (got ${typed}).` };
      return { isValid: true, values: { ...values, rpe: typed } };
  }
}
