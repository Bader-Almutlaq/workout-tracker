/**
 * Every unit a weight can be entered or displayed in, as stored in `workoutSet.entryUnit` and
 * `exercise.defaultEntryUnit`. Storage is always kilograms (see `docs/DATA.md`); a unit only
 * describes how a number was typed or should be shown.
 */
export const WEIGHT_UNITS = ['kg', 'lb'] as const;

/** A unit a weight can be entered or displayed in: `'kg'` (kilograms) or `'lb'` (pounds). */
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

/** Exact kilograms in one avoirdupois pound (international definition, 1959). */
export const KILOGRAMS_PER_POUND = 0.45359237;

/** The other unit; used by the one-tap kg/lb toggle. */
export function toggledWeightUnit(unit: WeightUnit): WeightUnit {
  return unit === 'kg' ? 'lb' : 'kg';
}
