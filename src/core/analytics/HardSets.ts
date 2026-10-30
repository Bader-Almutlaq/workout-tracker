import { isWorkSetKind } from '../models/SetKind';
import type { WorkoutSet } from '../models/WorkoutSet';

/** The fields needed to count performed hard sets; load and reps do not change the count. */
export type HardSet = Pick<WorkoutSet, 'kind' | 'rpe' | 'isCompleted'>;

/**
 * Report, "The recommended algorithms, in one place", items 1 and 10 (Zourdos 2016).
 * Heuristic: RIR ≤ 4 is a practitioner cutoff, not a validated physiological boundary.
 * Unknown effort counts as hard; failure takes precedence over a conflicting RPE.
 */
export const HardSetPolicy = Object.freeze({ maximumRpe: 10, maximumRir: 4, primaryWeight: 1, secondaryWeight: 0.5 });

/**
 * Whether a completed non-warm-up set is hard: RIR = 10 − RPE ≤ 4, or effort unknown.
 * Failure means RIR 0. Source: research report, recommended algorithms, items 1 and 10.
 */
export function isHardSet(set: HardSet): boolean {
  if (!set.isCompleted || !isWorkSetKind(set.kind)) return false;
  return set.kind === 'failure' || set.rpe === null || HardSetPolicy.maximumRpe - set.rpe <= HardSetPolicy.maximumRir;
}
