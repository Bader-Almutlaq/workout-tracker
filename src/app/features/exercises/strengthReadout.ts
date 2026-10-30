import type { ExerciseStrengthSession } from '../../../core/queries/ExerciseStrength';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { dayWithYearText } from '../../format/dateText';
import { FORMAT_LOCALE } from '../../format/formatLocale';
import { rpeText } from '../../format/setText';
import { weightText } from '../../format/weightText';

const rateFormat = new Intl.NumberFormat(FORMAT_LOCALE, {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

/** Best qualifying set in the exercise's display unit; unknown effort stays explicitly unknown. */
export function strengthBestSetText(session: ExerciseStrengthSession, unit: WeightUnit): string {
  const set = session.bestSet;
  return `${weightText(set.weightKilograms, unit)} × ${set.reps} @ ${set.rpe === null ? 'RPE unknown' : rpeText(set.rpe)}`;
}

/** A calendar-key session readout with both weight units; UTC prevents date shifts on western phones. */
export function strengthReadout(session: ExerciseStrengthSession, unit: WeightUnit): string {
  const otherUnit = unit === 'kg' ? 'lb' : 'kg';
  return `${dayWithYearText(session.date, 'UTC')} · e1RM ${weightText(session.e1rmKilograms, unit)} (${weightText(session.e1rmKilograms, otherUnit)}) · best ${strengthBestSetText(session, unit)}`;
}

/** Descriptive weekly trend rate; null is missing evidence, and rounding cannot display negative zero. */
export function strengthWeeklyChangeText(percent: number | null): string {
  return percent === null ? '—' : `${rateFormat.format(percent)}% per week`;
}
