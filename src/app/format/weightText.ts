import { displayValue } from '../../core/units/Weight';
import type { WeightUnit } from '../../core/units/WeightUnit';
import { FORMAT_LOCALE } from './formatLocale';

/** Whole numbers stay whole ("135"); fractions keep up to two digits ("102.5", "61.23"). */
const weightFormat = new Intl.NumberFormat(FORMAT_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Volume is a total of many sets, so whole kilograms are precise enough. */
const volumeFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 0 });

/**
 * Just the number of a stored weight in `unit`, e.g. "135", for set rows where the unit is shown
 * once. The rounding comes from `displayValue` (61.23 kg reads as 135 lb, not 134.99); nothing is
 * converted here. Port of `Weight.number(in:)` in the native app.
 *
 * @param kilograms The weight as stored.
 */
export function weightNumberText(kilograms: number, unit: WeightUnit): string {
  return weightFormat.format(displayValue(kilograms, unit));
}

/** A stored weight as text in `unit`, e.g. "135 lb" or "102.5 kg". Port of `Weight.formatted(in:)`. */
export function weightText(kilograms: number, unit: WeightUnit): string {
  return `${weightNumberText(kilograms, unit)} ${unit}`;
}

/**
 * A workout's volume load, e.g. "1,234 kg". Always kilograms: totals share one scale
 * (`docs/DESIGN.md` → Units).
 */
export function volumeText(kilograms: number): string {
  return `${volumeFormat.format(kilograms)} kg`;
}
