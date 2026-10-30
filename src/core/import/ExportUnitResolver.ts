import { inferEntryUnit } from '../units/Weight';
import type { WeightUnit } from '../units/WeightUnit';

/** The verdict for one exercise. */
export interface UnitVerdict {
  /** The unit the exercise's column is written in. */
  readonly columnUnit: WeightUnit;
  /** Non-round values consistent only with a kg column. */
  readonly kilogramVotes: number;
  /** Non-round values consistent only with a lb column. */
  readonly poundVotes: number;
}

/**
 * Decides which unit each exercise's weights are written in within a Strong export.
 *
 * Strong keeps a unit per exercise and exports each exercise in its *current* unit, whatever the
 * header says (see `docs/DATA.md`). The two cases leave different fingerprints on values that
 * aren't round numbers:
 * - a **kg column** holding sets typed in lb shows whole pounds converted to kg (61.23 = 135 lb),
 *   which are *not* round kg once converted back as if lb;
 * - a **lb column** holding sets typed in kg shows round kg converted to lb (99.21 = 45 kg).
 *
 * Each non-round value votes for the reading under which it makes sense; the majority wins. Round
 * values (140, 102.5) fit both readings and don't vote.
 *
 * Resolves the column unit for one exercise from all its exported weight values. Ties (including
 * no votes at all) resolve to kilograms, Strong's default.
 */
export function resolveExportUnit(values: readonly number[]): UnitVerdict {
  let kilogramVotes = 0;
  let poundVotes = 0;
  for (const value of values) {
    if (value <= 0) continue;
    const readAsKilograms = inferEntryUnit(value, 'kg');
    const readAsPounds = inferEntryUnit(value, 'lb');
    // A round value is "typed in the column unit" under both readings: no information.
    if (readAsKilograms === 'kg' && readAsPounds === 'lb') continue;
    if (readAsKilograms !== undefined && readAsPounds === undefined) kilogramVotes += 1;
    if (readAsPounds !== undefined && readAsKilograms === undefined) poundVotes += 1;
  }
  return {
    columnUnit: poundVotes > kilogramVotes ? 'lb' : 'kg',
    kilogramVotes,
    poundVotes,
  };
}
