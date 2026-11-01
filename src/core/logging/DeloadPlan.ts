import type { Exercise } from '../models/Exercise';
import type { WorkoutSet } from '../models/WorkoutSet';
import { loadProfileFor, roundToLoadable } from '../units/LoadableWeight';
import type { WeightUnit } from '../units/WeightUnit';
import { isBigBarbellCompound } from './WarmupPlan';

/** Performed exercise stage: first reduction, then build-back; null elsewhere means normal. */
export type DeloadStage = 1 | 2;

/** Which quantities the owner reduces. */
export type DeloadMode = 'load' | 'sets' | 'both';

/** Nullable settings retain the original load-only defaults. */
export interface DeloadSettings {
  readonly mode: DeloadMode | null;
  readonly loadPercent: number | null;
  readonly setPercent: number | null;
}

/** Exact kg suggestion (null for bodyweight), unchanged previous reps and descriptive reduction. Never persisted. */
export interface DeloadSuggestion {
  readonly weightKilograms: number | null;
  readonly reps: number;
  readonly reductionPercent: number;
}

/** Heuristic: owner's T-062 choice keeps sets/reps, reducing big lifts 20%/10% and others 10%/5%.
 * Differs from research report §12.9's 40–50% fewer sets plus −10% load or +2–3 RIR.
 */
const reductions = Object.freeze({
  big: Object.freeze({ 1: 20, 2: 10 }),
  other: Object.freeze({ 1: 10, 2: 5 }),
  percent: 100,
  defaultSetPercent: 50,
  halfPercentSteps: 2,
});

type DeloadExercise = Pick<
  Exercise,
  | 'equipment'
  | 'tracking'
  | 'mechanic'
  | 'movementPattern'
  | 'defaultEntryUnit'
  | 'loadStepKilograms'
  | 'barWeightKilograms'
>;
type PreviousSet = Pick<WorkoutSet, 'kind' | 'weightKilograms' | 'reps'>;

/** Pure opt-in deload calculations; stage 2 uses the original normal loads, never a second reduction of stage 1. */
export const DeloadPlan = Object.freeze({
  /** Nominal percent reduction; bodyweight and unloaded timing have no load reduction. */
  reductionPercent(exercise: DeloadExercise, stage: DeloadStage, settings?: DeloadSettings): number {
    if (exercise.tracking !== 'weight-reps' && exercise.tracking !== 'weight-duration') return 0;
    if (settings?.mode === 'sets') return 0;
    if (settings?.loadPercent !== null && settings?.loadPercent !== undefined) {
      return stage === 1 ? settings.loadPercent : Math.round(settings.loadPercent) / reductions.halfPercentSteps;
    }
    return (isBigBarbellCompound(exercise) ? reductions.big : reductions.other)[stage];
  },
  /** Stage 1 advances once; stage 2 and normal return to normal. No calendar-based expiry. */
  nextStage(previous: DeloadStage | null, mode: DeloadMode | null = null): DeloadStage | null {
    return previous === 1 && mode !== 'sets' ? 2 : null;
  },
  /** Working sets kept: ceil(count × (1 − percent / 100)), at least one. Research report §12.9 suggests 40–50% fewer sets. */
  keptSets(count: number, percent: number = reductions.defaultSetPercent): number {
    return Math.max(1, Math.ceil(count * (1 - percent / reductions.percent)));
  },
  /**
   * Aligns suggestions to current set kinds, skipping warm-ups and unmatched history; sets are never added.
   * Load = pre-cycle kg × (1 − percent / 100), rounded down using the current entry-unit ladder.
   * Heuristic: when an original normal position is missing, omit its load rather than compound reductions.
   * Bodyweight keeps load unchanged (null suggestion); reps always repeat the immediate previous work set.
   * Equipment minimum is respected by roundToLoadable; never suggests increasing a historical load.
   */
  suggestions(
    previous: readonly PreviousSet[],
    targets: readonly Pick<WorkoutSet, 'kind'>[],
    exercise: DeloadExercise,
    stage: DeloadStage,
    unit: WeightUnit = exercise.defaultEntryUnit,
    baseline: readonly PreviousSet[] = previous,
    settings?: DeloadSettings,
  ): (DeloadSuggestion | null)[] {
    const work = previous.filter((set) => set.kind !== 'warmup');
    const normal = baseline.filter((set) => set.kind !== 'warmup');
    const reductionPercent = DeloadPlan.reductionPercent(exercise, stage, settings);
    const profile = loadProfileFor(exercise, unit);
    let position = 0;
    return targets.map((target) => {
      if (target.kind === 'warmup') return null;
      const prior = work[position];
      const base = normal[position++];
      if (prior === undefined) return null;
      const load =
        reductionPercent === 0 || base === undefined || base.weightKilograms <= 0
          ? null
          : roundToLoadable(base.weightKilograms * (1 - reductionPercent / reductions.percent), profile, 'down');
      return {
        weightKilograms: load !== null && base !== undefined && load <= base.weightKilograms ? load : null,
        reps: prior.reps,
        reductionPercent,
      };
    });
  },
});
