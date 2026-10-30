import type { WorkoutSet } from '../models/WorkoutSet';

/**
 * Report, "The recommended algorithms, in one place", item 1: RIR = 10 − RPE,
 * failure overrides effort, unknown RIR = 2. Heuristic: unknown effort receives
 * half the trend weight; the report asks for less weight without fixing a value.
 */
export const EffectiveRepsDefaults = {
  maximumRpe: 10,
  minimumRpe: 1,
  unknownRepsInReserve: 2,
  knownEffortWeight: 1,
  unknownEffortWeight: 0.5,
} as const;

/** Repetitions to failure (E), remaining repetitions (RIR), and relative trend weight. */
export interface EffectiveReps {
  readonly effectiveReps: number;
  readonly repsInReserve: number;
  readonly trendWeight: number;
}

/**
 * E = reps + RIR, with RIR = 10 − RPE, failure = 0, unknown = 2.
 * Report, "The recommended algorithms, in one place", item 1.
 * Returns null for non-positive/non-integer reps or invalid logged RPE; failure
 * ignores logged RPE because the set kind explicitly establishes RIR 0.
 */
export function effectiveReps(set: Pick<WorkoutSet, 'kind' | 'reps' | 'rpe'>): EffectiveReps | null {
  if (!Number.isInteger(set.reps) || set.reps <= 0) return null;
  const isFailure = set.kind === 'failure';
  if (
    !isFailure &&
    set.rpe !== null &&
    (!Number.isFinite(set.rpe) ||
      set.rpe < EffectiveRepsDefaults.minimumRpe ||
      set.rpe > EffectiveRepsDefaults.maximumRpe)
  ) {
    return null;
  }
  const repsInReserve = isFailure
    ? 0
    : set.rpe === null
      ? EffectiveRepsDefaults.unknownRepsInReserve
      : EffectiveRepsDefaults.maximumRpe - set.rpe;
  return {
    effectiveReps: set.reps + repsInReserve,
    repsInReserve,
    trendWeight:
      isFailure || set.rpe !== null
        ? EffectiveRepsDefaults.knownEffortWeight
        : EffectiveRepsDefaults.unknownEffortWeight,
  };
}
