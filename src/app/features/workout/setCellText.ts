import type { ExerciseTracking } from '../../../core/library/ExerciseTracking';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { displayValue } from '../../../core/units/Weight';
import { clockText } from '../../format/clockText';
import { rpeNumberText } from '../../format/setText';
import { weightNumberText, weightText } from '../../format/weightText';
import type { Field } from './Cell';
import { draftTextFor } from './numberDraft';
import { isBodyweightLoad, recordsDuration } from './trackingKinds';

/** The parts of a set the cells show. */
type CellSet = Pick<WorkoutSet, 'weightKilograms' | 'entryUnit' | 'reps' | 'rpe' | 'durationSeconds'>;

/** Shown in the weight cell of an unloaded bodyweight set. */
const BODYWEIGHT_TEXT = 'BW';

/** Shown where a value is not logged. */
const EMPTY_TEXT = '—';

/** The weight cell: the number in the set's own unit, or "BW" for unloaded bodyweight sets. */
export function weightCellText(set: CellSet, tracking: ExerciseTracking): string {
  if (isBodyweightLoad(tracking) && set.weightKilograms === 0) return BODYWEIGHT_TEXT;
  return weightNumberText(set.weightKilograms, set.entryUnit);
}

/** The reps cell: a rep count, or m:ss for timed exercises. */
export function repsCellText(set: CellSet, tracking: ExerciseTracking): string {
  return recordsDuration(tracking) ? clockText(set.durationSeconds ?? 0) : String(set.reps);
}

/** The RPE cell: "8" or "8.5", or "—" when not logged. */
export function rpeCellText(set: CellSet): string {
  return set.rpe === null ? EMPTY_TEXT : rpeNumberText(set.rpe);
}

/** What the cell of `field` shows when it is not being edited. */
export function cellText(set: CellSet, field: Field, tracking: ExerciseTracking): string {
  switch (field) {
    case 'weight':
      return weightCellText(set, tracking);
    case 'reps':
      return repsCellText(set, tracking);
    case 'rpe':
      return rpeCellText(set);
  }
}

/** Whether the cell holds nothing yet (0, or no RPE), so it is drawn quieter. An unloaded bodyweight set is not empty. */
export function isCellEmpty(set: CellSet, field: Field, tracking: ExerciseTracking): boolean {
  switch (field) {
    case 'weight':
      return set.weightKilograms === 0 && !isBodyweightLoad(tracking);
    case 'reps':
      return (recordsDuration(tracking) ? (set.durationSeconds ?? 0) : set.reps) === 0;
    case 'rpe':
      return set.rpe === null;
  }
}

/** The text a cell starts with when the pad opens on it, in the set's own unit. Zero and unset values start empty. */
export function cellStartText(set: CellSet, field: Field, tracking: ExerciseTracking): string {
  switch (field) {
    case 'weight':
      return set.weightKilograms === 0 ? '' : draftTextFor(displayValue(set.weightKilograms, set.entryUnit));
    case 'reps': {
      const amount = recordsDuration(tracking) ? (set.durationSeconds ?? 0) : set.reps;
      return amount === 0 ? '' : draftTextFor(amount);
    }
    case 'rpe':
      return set.rpe === null ? '' : draftTextFor(set.rpe);
  }
}

/**
 * What a set was last time, for the PREVIOUS column, in `unit`: "135 lb × 8", "BW × 12", "+10 kg × 12"
 * or "1:30" for a timed set.
 */
export function previousText(set: CellSet, tracking: ExerciseTracking, unit: WeightUnit): string {
  const load =
    isBodyweightLoad(tracking) && set.weightKilograms === 0
      ? BODYWEIGHT_TEXT
      : `${isBodyweightLoad(tracking) ? '+' : ''}${weightText(set.weightKilograms, unit)}`;
  switch (tracking) {
    case 'weight-reps':
    case 'bodyweight-reps':
      return `${load} × ${set.reps}`;
    case 'duration':
      return clockText(set.durationSeconds ?? 0);
    case 'weight-duration':
      return `${load} × ${clockText(set.durationSeconds ?? 0)}`;
  }
}
