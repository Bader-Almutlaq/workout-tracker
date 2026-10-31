import type { Equipment } from '../library/Equipment';
import type { Exercise } from '../models/Exercise';
import { toKilograms, WeightTolerance } from './Weight';
import type { WeightUnit } from './WeightUnit';

/** A load ladder in exact kg; null step means unrestricted load, including zero. */
export interface LoadProfile {
  readonly minimumKilograms: number;
  readonly stepKilograms: number | null;
}

/** Heuristic: typical gym equipment and cable add-on plates, as agreed in T-044 and T-053. */
const LoadingDefaults = {
  plateStep: { kg: 2.5, lb: 5 },
  landmineStep: { kg: 1.25, lb: 2.5 },
  cableStep: { kg: 1.25, lb: 2.5 },
  cableMinimum: { kg: 2.5, lb: 5 },
  stackStep: { kg: 5, lb: 10 },
  kettlebellStep: { kg: 4, lb: 5 },
  bars: {
    barbell: 20,
    'ez-bar': 10,
    'trap-bar': 25,
    'safety-bar': 30,
    'smith-machine': 15,
    landmine: 20,
    'plate-loaded': 0,
  },
  poundBarbell: 45,
} as const;

/** Whether equipment has an empty bar or starting carriage weight, editable in kg or lb. */
export function isBarEquipment(equipment: Equipment | null | undefined): boolean {
  return equipment !== null && equipment !== undefined && Object.hasOwn(LoadingDefaults.bars, equipment);
}

/** Default ladder for the exercise's entry unit; stored kg overrides are never converted twice. */
export function loadProfileFor(
  exercise: Pick<Exercise, 'equipment' | 'loadStepKilograms' | 'barWeightKilograms'>,
  unitSystem: WeightUnit,
): LoadProfile {
  const equipment = exercise.equipment;
  let minimumKilograms: number;
  let stepKilograms: number;
  switch (equipment) {
    case 'barbell':
    case 'ez-bar':
    case 'trap-bar':
    case 'safety-bar':
    case 'smith-machine':
    case 'landmine':
    case 'plate-loaded':
      minimumKilograms =
        equipment === 'barbell' && unitSystem === 'lb'
          ? toKilograms(LoadingDefaults.poundBarbell, 'lb')
          : LoadingDefaults.bars[equipment];
      stepKilograms = toKilograms(
        equipment === 'landmine' ? LoadingDefaults.landmineStep[unitSystem] : LoadingDefaults.plateStep[unitSystem],
        unitSystem,
      );
      break;
    case 'dumbbell':
    case 'kettlebell':
      stepKilograms = toKilograms(
        equipment === 'kettlebell' ? LoadingDefaults.kettlebellStep[unitSystem] : LoadingDefaults.plateStep[unitSystem],
        unitSystem,
      );
      minimumKilograms = exercise.loadStepKilograms ?? stepKilograms;
      break;
    case 'cable':
      stepKilograms = toKilograms(LoadingDefaults.cableStep[unitSystem], unitSystem);
      minimumKilograms =
        exercise.loadStepKilograms ?? toKilograms(LoadingDefaults.cableMinimum[unitSystem], unitSystem);
      break;
    case 'machine':
      stepKilograms = toKilograms(LoadingDefaults.stackStep[unitSystem], unitSystem);
      minimumKilograms = exercise.loadStepKilograms ?? stepKilograms;
      break;
    default:
      return { minimumKilograms: 0, stepKilograms: null };
  }
  return {
    minimumKilograms: isBarEquipment(equipment) ? (exercise.barWeightKilograms ?? minimumKilograms) : minimumKilograms,
    stepKilograms: exercise.loadStepKilograms ?? stepKilograms,
  };
}

/** Rounds a finite kg suggestion, clamping to the minimum; nearest ties go down. Unrestricted loads pass through. */
export function roundToLoadable(weightKilograms: number, profile: LoadProfile, mode: 'nearest' | 'down'): number {
  const step = profile.stepKilograms;
  if (step === null) return weightKilograms;
  const offset = Math.max(0, (weightKilograms - profile.minimumKilograms) / step);
  const lower = Math.floor(offset + WeightTolerance.floatingPoint);
  const index = mode === 'down' || offset - lower <= 0.5 + WeightTolerance.floatingPoint ? lower : lower + 1;
  return profile.minimumKilograms + index * step;
}

/** All discrete loadable kg values up to a finite kg ceiling; unrestricted profiles have no discrete ladder. */
export function loadableWeights(profile: LoadProfile, maximumKilograms: number): number[] {
  const step = profile.stepKilograms;
  if (step === null || !Number.isFinite(maximumKilograms) || maximumKilograms < profile.minimumKilograms) return [];
  const count = Math.floor((maximumKilograms - profile.minimumKilograms) / step + WeightTolerance.floatingPoint) + 1;
  return Array.from({ length: count }, (_, index) => profile.minimumKilograms + index * step);
}
