import { valueIn } from '../../core/units/Weight';
import type { WeightUnit } from '../../core/units/WeightUnit';
import { FORMAT_LOCALE } from './formatLocale';

/** Heuristic: estimates (e1RM, trends) read best at natural load steps, 0.5 kg or 1 lb, with at most one decimal. */
const estimateSteps = Object.freeze({ kilograms: 0.5, pounds: 1 });
const estimateFormat = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 1 });

/** An estimated weight (stored in kg) rounded for display in `unit`, e.g. "133.5 kg" or "294 lb". */
export function estimateText(kilograms: number, unit: WeightUnit): string {
  const step = unit === 'kg' ? estimateSteps.kilograms : estimateSteps.pounds;
  const rounded = Math.round(valueIn(kilograms, unit) / step) * step;
  return `${estimateFormat.format(rounded)} ${unit}`;
}
