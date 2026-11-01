import type { ProgressTopSet } from '../../../core/queries/ExerciseProgress';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { loggedRpeSuffix } from '../../format/setText';
import { weightText } from '../../format/weightText';
import { FORMAT_LOCALE } from '../../format/formatLocale';

const percent = new Intl.NumberFormat(FORMAT_LOCALE, { maximumFractionDigits: 1, signDisplay: 'exceptZero' });

/** External load and logged effort in the exercise entry unit; positive bodyweight additions retain “+”. */
export function progressTopSetText(
  set: ProgressTopSet | null,
  unit: WeightUnit,
  bodyweight: boolean,
  withRpe = true,
): string {
  if (set === null) return '—';
  const prefix = bodyweight && set.weightKilograms > 0 ? '+' : '';
  const load =
    bodyweight && set.weightKilograms === 0 ? 'Bodyweight' : `${prefix}${weightText(set.weightKilograms, unit)}`;
  return `${load} × ${set.reps}${withRpe ? loggedRpeSuffix(set.rpe) : ''}`;
}

/** Relative change against four non-deload sessions ago, omitted when either endpoint lacks an estimate. */
export function progressChangeText(value: number | null): string {
  return value === null ? 'Not enough comparable sessions' : `${percent.format(value)}% vs 4 sessions ago`;
}
