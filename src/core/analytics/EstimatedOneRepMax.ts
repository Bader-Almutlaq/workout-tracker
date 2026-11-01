import type { PersonalCurve } from './PersonalCurve';
import type { Equipment } from '../library/Equipment';
import type { MovementPattern } from '../library/MovementPattern';
import type { Exercise } from '../models/Exercise';
import { isWorkSetKind } from '../models/SetKind';
import type { WorkoutSet } from '../models/WorkoutSet';
import { effectiveReps, type EffectiveReps } from './EffectiveReps';

/**
 * Report, "The recommended algorithms, in one place", items 1, 2 and 4.
 * k is dimensionless, E ≤ 12, RIR ≤ 4; E > 10 is low confidence.
 * Heuristic: bar variants use barbell k, Smith/plate-loaded use machine k,
 * kettlebells use dumbbell k, and lunges/hip thrusts are lower-body compounds.
 * Unmapped compounds are omitted rather than assigned an invented category.
 */
export const EstimatedOneRepMaxDefaults = {
  maximumEffectiveReps: 12,
  maximumRepsInReserve: 4,
  highConfidenceEffectiveReps: 10,
  k: {
    barbellLowerBody: 38,
    barbellUpperBody: 29,
    machineCompound: 24,
    dumbbellCompound: 20,
    isolation: 15,
  },
  compoundEquipment: {
    barbell: 'barbell',
    'ez-bar': 'barbell',
    'trap-bar': 'barbell',
    'safety-bar': 'barbell',
    machine: 'machine',
    cable: 'machine',
    'smith-machine': 'machine',
    'plate-loaded': 'machine',
    dumbbell: 'dumbbell',
    kettlebell: 'dumbbell',
  },
  lowerBodyPatterns: ['squat', 'lunge', 'hinge', 'hip-thrust'],
  upperBodyPatterns: ['horizontal-push', 'vertical-push', 'horizontal-pull', 'vertical-pull'],
} as const;

/** Exercise metadata and optional canonical personal curve; pure callers without history use the lift-type prior. */
export type StrengthExercise = Pick<Exercise, 'equipment' | 'movementPattern' | 'mechanic' | 'tracking'> & {
  readonly strengthCurve?: PersonalCurve;
};

/** A qualifying set estimate in kg, with the report's confidence and effort information. */
export interface EstimatedOneRepMax extends EffectiveReps {
  readonly e1rmKilograms: number;
  readonly isLowConfidence: boolean;
}

function includesPattern(patterns: readonly MovementPattern[], pattern: MovementPattern | null): boolean {
  return pattern !== null && patterns.includes(pattern);
}

function compoundEquipment(equipment: Equipment | null): 'barbell' | 'machine' | 'dumbbell' | null {
  const table = EstimatedOneRepMaxDefaults.compoundEquipment;
  // Iteration keeps lookup type-safe for equipment the report does not classify.
  for (const [key, category] of Object.entries(table)) {
    if (key === equipment) return category;
  }
  return null;
}

/** Report item 2: dimensionless lift-type prior, null for unmapped compounds. */
export function startingStrengthK(exercise: StrengthExercise): number | null {
  const defaults = EstimatedOneRepMaxDefaults;
  if (exercise.mechanic === 'isolation') return defaults.k.isolation;
  if (exercise.mechanic !== 'compound') return null;
  const equipment = compoundEquipment(exercise.equipment);
  if (equipment === 'machine') return defaults.k.machineCompound;
  if (equipment === 'dumbbell') return defaults.k.dumbbellCompound;
  if (equipment === 'barbell') {
    if (includesPattern(defaults.lowerBodyPatterns, exercise.movementPattern)) return defaults.k.barbellLowerBody;
    if (includesPattern(defaults.upperBodyPatterns, exercise.movementPattern)) return defaults.k.barbellUpperBody;
  }
  return null;
}

/**
 * e1RM = weight × (1 + (E − 1) / k), in kg, without display rounding.
 * Report, "The recommended algorithms, in one place", items 1, 2 and 4.
 * A true single returns its load. Warm-ups, E > 12, RIR > 4, invalid/non-positive
 * loads and unclassified exercises without a fitted personal curve return null. Only weight-reps tracking is
 * supported: added/assisted bodyweight alone is not the total lifted mass.
 */
export function estimatedOneRepMax(
  set: Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps' | 'rpe'>,
  exercise: StrengthExercise,
): EstimatedOneRepMax | null {
  if (
    !isWorkSetKind(set.kind) ||
    exercise.tracking !== 'weight-reps' ||
    !Number.isFinite(set.weightKilograms) ||
    set.weightKilograms <= 0
  ) {
    return null;
  }
  const effort = effectiveReps(set);
  const k = exercise.strengthCurve === undefined ? startingStrengthK(exercise) : exercise.strengthCurve.k;
  if (
    effort === null ||
    k === null ||
    effort.effectiveReps > EstimatedOneRepMaxDefaults.maximumEffectiveReps ||
    effort.repsInReserve > EstimatedOneRepMaxDefaults.maximumRepsInReserve
  ) {
    return null;
  }
  const e1rmKilograms = set.weightKilograms * (1 + (effort.effectiveReps - 1) / k);
  if (!Number.isFinite(e1rmKilograms)) return null;
  return {
    ...effort,
    e1rmKilograms,
    isLowConfidence: effort.effectiveReps > EstimatedOneRepMaxDefaults.highConfidenceEffectiveReps,
  };
}
