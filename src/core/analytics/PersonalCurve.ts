import { estimatedOneRepMax, startingStrengthK, type StrengthExercise } from './EstimatedOneRepMax';
import type { WorkoutSet } from '../models/WorkoutSet';

/** Report, recommended algorithms item 3. Heuristic: half-step search and relative weighted variance in anchored 14-day windows. */
export const PersonalCurvePolicy = Object.freeze({
  minimumSets: 10,
  minimumRepCounts: 2,
  priorSets: 15,
  minimumK: 8,
  maximumK: 50,
  step: 0.5,
  windowMilliseconds: 14 * 86_400_000,
});

/** Dimensionless fitted k; null without a classified prior or identifiable personal fit. n counts qualifying sets. */
export interface PersonalCurve {
  readonly k: number | null;
  readonly kStart: number | null;
  readonly personalSets: number;
  readonly isPersonal: boolean;
}

/** A completed strength observation dated by its finished session (ISO timestamp). Loads are exact kg. */
export type PersonalCurveSet = Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps' | 'rpe'> & {
  readonly date: string;
};

/**
 * Fits k by minimising Σ weighted relative variance of e1RMs within 14-day windows.
 * Report, recommended algorithms 1–3: E = reps + RIR; e1RM = w(1+(E−1)/k);
 * k = (n*k_yours + 15*k_start)/(n+15), bounded 8–50. Unknown effort has half weight.
 * Heuristic: windows anchor to the earliest valid set; windows need distinct E to identify a curve.
 * With no classified prior an identifiable fit is used directly, without inventing a prior.
 */
export function personalCurve(exercise: StrengthExercise, sets: readonly PersonalCurveSet[]): PersonalCurve {
  const policy = PersonalCurvePolicy;
  const kStart = startingStrengthK(exercise);
  const valid = sets
    .flatMap((set) => {
      const estimate = estimatedOneRepMax(set, {
        ...exercise,
        strengthCurve: { k: policy.minimumK, kStart, personalSets: 0, isPersonal: false },
      });
      const time = Date.parse(set.date);
      return estimate === null || !Number.isFinite(time)
        ? []
        : [{ time, weight: set.weightKilograms, effort: estimate }];
    })
    .sort(
      (a, b) =>
        a.time - b.time ||
        a.effort.effectiveReps - b.effort.effectiveReps ||
        a.weight - b.weight ||
        a.effort.trendWeight - b.effort.trendWeight,
    );
  const fallback = { k: kStart, kStart, personalSets: valid.length, isPersonal: false };
  const first = valid[0];
  if (
    first === undefined ||
    valid.length < policy.minimumSets ||
    new Set(valid.map((set) => set.effort.effectiveReps)).size < policy.minimumRepCounts
  )
    return fallback;
  const windows = new Map<number, typeof valid>();
  for (const set of valid) {
    const index = Math.floor((set.time - first.time) / policy.windowMilliseconds);
    const group = windows.get(index) ?? [];
    group.push(set);
    windows.set(index, group);
  }
  const groups = [...windows.values()].filter(
    (group) => new Set(group.map((set) => set.effort.effectiveReps)).size >= policy.minimumRepCounts,
  );
  if (groups.length === 0) return fallback;
  let bestK = policy.minimumK;
  let bestLoss = Infinity;
  for (let k = policy.minimumK; k <= policy.maximumK; k += policy.step) {
    let loss = 0;
    for (const group of groups) {
      const values = group.map((set) => ({
        value: set.weight * (1 + (set.effort.effectiveReps - 1) / k),
        weight: set.effort.trendWeight,
      }));
      const totalWeight = values.reduce((sum, set) => sum + set.weight, 0);
      const mean = values.reduce((sum, set) => sum + set.value * set.weight, 0) / totalWeight;
      loss += values.reduce((sum, set) => sum + set.weight * (set.value / mean - 1) ** 2, 0);
    }
    if (loss < bestLoss) {
      bestLoss = loss;
      bestK = k;
    }
  }
  const blended =
    kStart === null ? bestK : (valid.length * bestK + policy.priorSets * kStart) / (valid.length + policy.priorSets);
  return {
    k: Math.max(policy.minimumK, Math.min(policy.maximumK, blended)),
    kStart,
    personalSets: valid.length,
    isPersonal: true,
  };
}
