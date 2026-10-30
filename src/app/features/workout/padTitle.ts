import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import type { Field } from './Cell';
import { isBodyweightLoad, recordsDuration } from './trackingKinds';

/** The heading of the number pad for the cell being edited, e.g. "Weight · lb", "Reps" or "Seconds". */
export function padTitle(field: Field, tracking: ExerciseTracking, unit: WeightUnit): string {
  switch (field) {
    case 'weight':
      return `${isBodyweightLoad(tracking) ? 'Added weight' : 'Weight'} · ${unit}`;
    case 'reps':
      return recordsDuration(tracking) ? 'Seconds' : 'Reps';
    case 'rpe':
      return 'RPE';
  }
}
