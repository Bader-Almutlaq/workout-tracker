import { KILOGRAMS_PER_POUND, type WeightUnit } from './WeightUnit';

/**
 * Numeric tolerances used by weight conversion and unit inference.
 *
 * This folder is the single place kg ↔ lb conversion happens. Store kilograms exactly as entered
 * or imported; convert only for display.
 */
export const WeightTolerance = {
  /** Absorbs binary floating-point error in values such as 102.5. */
  floatingPoint: 1e-9,
  /**
   * Strong rounds converted values to 0.01 (max error 0.005), plus a small margin for its
   * occasional 0.1 rounding of whole pounds (110 lb → 49.9 kg).
   */
  strongRounding: 0.006,
  /** How close a converted value must be to a 0.25 step to display as that step. */
  displaySnap: 0.02,
} as const;

/** The step weights are typed in: plates and dumbbells come in multiples of 0.25 of the unit. */
const TYPING_STEP = 0.25;

/** Display values and Strong's converted values are rounded to 0.01. */
const HUNDREDTHS = 100;

/**
 * Rounds to the nearest integer, halves away from zero. This is Swift's `rounded()`, which the
 * native tests were written against; `Math.round` rounds halves up instead, which differs below zero.
 */
function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Whether `value` is within `tolerance` of a multiple of `step`. */
function isMultiple(value: number, step: number, tolerance: number): boolean {
  return Math.abs(value - roundHalfAwayFromZero(value / step) * step) <= tolerance;
}

/** Kilograms for a number typed in `unit`. Never rounded. */
export function toKilograms(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KILOGRAMS_PER_POUND;
}

/** The exact value of `kilograms` in `unit`, without rounding. */
export function valueIn(kilograms: number, unit: WeightUnit): number {
  return unit === 'kg' ? kilograms : kilograms / KILOGRAMS_PER_POUND;
}

/**
 * The value of `kilograms` in `unit`, rounded the way a lifter would read it.
 *
 * Snaps to the nearest 0.25 when within `WeightTolerance.displaySnap` of it (so 61.23 kg shows as
 * 135 lb, not 134.99 lb); otherwise rounds to 0.01.
 */
export function displayValue(kilograms: number, unit: WeightUnit): number {
  const exact = valueIn(kilograms, unit);
  const quarter = roundHalfAwayFromZero(exact / TYPING_STEP) * TYPING_STEP;
  if (Math.abs(exact - quarter) <= WeightTolerance.displaySnap) return quarter;
  return roundHalfAwayFromZero(exact * HUNDREDTHS) / HUNDREDTHS;
}

/**
 * Guesses the unit a number was originally typed in, given the unit it is now expressed in.
 *
 * Strong converts an exercise's history when its unit is switched and rounds the result to 0.01,
 * so a value typed in the *other* unit shows up as a round number plus a small rounding error
 * (see `docs/DATA.md`).
 *
 * Heuristic, checked against the owner's export. A random value hits the whole-pound grid by
 * chance ~2.6% of the time, the 0.25 kg grid ~4.8%.
 *
 * @param value The number as stored or exported.
 * @param columnUnit The unit `value` is expressed in.
 * @returns `columnUnit` when `value` is a multiple of 0.25 in that unit (or zero); the other unit
 *   when the converted value lands on that unit's typing grid (whole pounds, or 0.25 kg) within
 *   Strong's rounding error; `undefined` when neither fits.
 */
export function inferEntryUnit(value: number, columnUnit: WeightUnit): WeightUnit | undefined {
  if (isMultiple(value, TYPING_STEP, WeightTolerance.floatingPoint)) return columnUnit;

  if (columnUnit === 'kg') {
    const pounds = value / KILOGRAMS_PER_POUND;
    const wholePoundsInKilograms = roundHalfAwayFromZero(pounds) * KILOGRAMS_PER_POUND;
    if (Math.abs(value - wholePoundsInKilograms) <= WeightTolerance.strongRounding) return 'lb';
  } else {
    const kilograms = value * KILOGRAMS_PER_POUND;
    if (isMultiple(kilograms, TYPING_STEP, WeightTolerance.strongRounding)) return 'kg';
  }
  return undefined;
}
