import { WorkoutLoggerLimits } from '../../../core/logging/WorkoutLogger';
import { valueIn } from '../../../core/units/Weight';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { Field } from './Cell';

/**
 * How far the number pad's − and + keys move each kind of value.
 *
 * Heuristic: the smallest plate jump in common use. Gym plates come in pairs of 1.25 kg (2.5 kg per
 * step) or 2.5 lb (5 lb per step); reps count in ones; RPE is rated in half steps (Zourdos 2016, the
 * scale `WorkoutLoggerLimits.rpeRange` follows).
 */
export const NumberPadSteps = {
  /** Weight step in kilograms. */
  kilograms: 2.5,
  /** Weight step in pounds. */
  pounds: 5,
  /** Reps and seconds step. */
  reps: 1,
  /** RPE step. */
  rpe: 0.5,
} as const;

/** What the − and + keys do to one cell: the step, and the bounds the value stays within. */
export interface PadRange {
  readonly step: number;
  readonly minimum: number;
  readonly maximum: number;
}

/** The step and bounds for `field`, with weights in `unit`. The bounds are the logger's own limits. */
export function padRange(field: Field, unit: WeightUnit): PadRange {
  switch (field) {
    case 'weight':
      return {
        step: unit === 'kg' ? NumberPadSteps.kilograms : NumberPadSteps.pounds,
        minimum: 0,
        maximum: valueIn(WorkoutLoggerLimits.maximumKilograms, unit),
      };
    case 'reps':
      return { step: NumberPadSteps.reps, minimum: 0, maximum: WorkoutLoggerLimits.maximumReps };
    case 'rpe':
      return {
        step: NumberPadSteps.rpe,
        minimum: WorkoutLoggerLimits.rpeRange.minimum,
        maximum: WorkoutLoggerLimits.rpeRange.maximum,
      };
  }
}
