import type { TemplateDraft } from '../../../core/templates/TemplateDraft';

/** Heuristic: the owner's T-060 starting range, offered for confirmation rather than saved automatically. */
export const ProgressionRangeDefaults = Object.freeze({ low: 8, high: 12 });

/** Sets this template's opt-in mode, filling only incomplete working ranges with the owner's confirmed range. */
export function withProgression(
  draft: TemplateDraft,
  exerciseIndex: number,
  progression: 'double' | null,
  range?: { readonly low: number; readonly high: number },
): TemplateDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, index) =>
      index !== exerciseIndex
        ? exercise
        : {
            ...exercise,
            progression,
            sets: exercise.sets.map((set) =>
              progression !== 'double' ||
              range === undefined ||
              set.kind === 'warmup' ||
              (set.targetRepsLow !== null && set.targetRepsHigh !== null)
                ? set
                : {
                    ...set,
                    targetRepsLow: range.low,
                    targetRepsHigh: range.high,
                  },
            ),
          },
    ),
  };
}
