import type { WeightUnit } from '../../../core/units/WeightUnit';
import { padRange, type PadRange } from '../workout/padRange';
import type { TargetField } from './TargetCell';

/** The heading of the number pad for a target: "Reps from", "Reps to" or "RPE". */
export function targetPadTitle(field: TargetField): string {
  switch (field) {
    case 'repsLow':
      return 'Reps from';
    case 'repsHigh':
      return 'Reps to';
    case 'rpe':
      return 'RPE';
  }
}

/** The weight unit `padRange` needs for a field that has no weight; any unit gives the same answer. */
const UNUSED_UNIT: WeightUnit = 'kg';

/** The step and bounds of the − and + keys for a target, the same as when logging a set. */
export function targetPadRange(field: TargetField): PadRange {
  return padRange(field === 'rpe' ? 'rpe' : 'reps', UNUSED_UNIT);
}
