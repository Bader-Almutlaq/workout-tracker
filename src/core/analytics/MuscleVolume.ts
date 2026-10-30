import { MUSCLES, type Muscle } from '../library/Muscle';
import type { MuscleRole } from '../library/MuscleRole';
import { HardSetPolicy, isHardSet, type HardSet } from './HardSets';

/** One performed or planned set's association with one muscle; a set can have several associations. */
export interface MuscleVolumeSet extends HardSet {
  readonly workoutId: number;
  readonly muscle: Muscle;
  readonly role: MuscleRole;
}

/**
 * Weekly fractional-set ranges from the research report, recommended algorithms, item 10.
 * Shared endpoints 10 and 20 enter the higher range; 30 remains in the 20–30 range.
 * Numeric names describe volume without prescribing a training target.
 */
export type MuscleVolumeZone = 'under-4' | '4-to-under-10' | '10-to-under-20' | '20-to-30' | 'over-30';

/**
 * Report, recommended algorithms, item 10: weekly zones and the >11 session soft limit
 * (Remmert preprint). These are descriptive ranges, not individual prescriptions.
 */
export const MuscleVolumeLimits = Object.freeze({ first: 4, second: 10, third: 20, fourth: 30, sessionSoftLimit: 11 });

/** One muscle's weekly sets; indirect sets are already weighted and totalSets = directSets + indirectSets. */
export interface MuscleVolume {
  readonly muscle: Muscle;
  readonly directSets: number;
  readonly indirectSets: number;
  readonly totalSets: number;
  readonly zone: MuscleVolumeZone;
  /** Workout IDs exceeding 11 fractional sets, in input order: "soft limit, preprint evidence". */
  readonly sessionsAboveSoftLimit: readonly number[];
}

/** An invalid secondary-muscle weight, rejected before any volume is calculated. */
export class MuscleVolumeError extends Error {
  readonly kind = 'invalidSecondaryWeight';

  /** The secondary weight must be a finite fraction from 0 to 1, inclusive. */
  constructor() {
    super('The secondary-muscle weight must be between 0 and 1.');
    this.name = 'MuscleVolumeError';
  }
}

/** The report's item 10 zone for a nonnegative weekly fractional-set total. */
export function muscleVolumeZone(totalSets: number): MuscleVolumeZone {
  if (totalSets < MuscleVolumeLimits.first) return 'under-4';
  if (totalSets < MuscleVolumeLimits.second) return '4-to-under-10';
  if (totalSets < MuscleVolumeLimits.third) return '10-to-under-20';
  if (totalSets <= MuscleVolumeLimits.fourth) return '20-to-30';
  return 'over-30';
}

/**
 * Σ hard sets × role weight for one week, with every muscle returned in taxonomy order, even at zero.
 * Direct = primary × 1; indirect = secondary × secondaryWeight (default 0.5, optionally 0.3).
 * Source: research report, "Count fractional hard sets for size" (Pelland 2025), item 10.
 * Each input association must occur once. Sessions are grouped by workout ID across exercises.
 */
export function muscleVolume(
  sets: readonly MuscleVolumeSet[],
  secondaryWeight: number = HardSetPolicy.secondaryWeight,
): MuscleVolume[] {
  if (!Number.isFinite(secondaryWeight) || secondaryWeight < 0 || secondaryWeight > HardSetPolicy.primaryWeight) {
    throw new MuscleVolumeError();
  }
  const totals = new Map<
    Muscle,
    { direct: number; secondary: number; sessions: Map<number, { direct: number; secondary: number }> }
  >();
  for (const set of sets) {
    if (!isHardSet(set)) continue;
    const total = totals.get(set.muscle) ?? {
      direct: 0,
      secondary: 0,
      sessions: new Map<number, { direct: number; secondary: number }>(),
    };
    const session = total.sessions.get(set.workoutId) ?? { direct: 0, secondary: 0 };
    if (set.role === 'primary') {
      total.direct += HardSetPolicy.primaryWeight;
      session.direct += HardSetPolicy.primaryWeight;
    } else {
      total.secondary += 1;
      session.secondary += 1;
    }
    total.sessions.set(set.workoutId, session);
    totals.set(set.muscle, total);
  }
  return MUSCLES.map((muscle) => {
    const total = totals.get(muscle);
    const directSets = total?.direct ?? 0;
    const indirectSets = (total?.secondary ?? 0) * secondaryWeight;
    const totalSets = directSets + indirectSets;
    return {
      muscle,
      directSets,
      indirectSets,
      totalSets,
      zone: muscleVolumeZone(totalSets),
      sessionsAboveSoftLimit: [...(total?.sessions ?? [])]
        .filter(([, count]) => count.direct + count.secondary * secondaryWeight > MuscleVolumeLimits.sessionSoftLimit)
        .map(([workoutId]) => workoutId),
    };
  });
}
