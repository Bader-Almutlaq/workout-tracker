import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { weightText } from '../../format/weightText';

/** Descriptive range and reasons in the displayed set units; absent when progression is off. */
export function progressionText(entry: LiveWorkoutEntry): string | undefined {
  const progression = entry.progression;
  if (progression === undefined) return undefined;
  const ranges = [
    ...new Set(
      progression.targets.flatMap((set) =>
        set.kind === 'warmup' || set.targetRepsLow === null || set.targetRepsHigh === null
          ? []
          : [`${set.targetRepsLow}–${set.targetRepsHigh} reps`],
      ),
    ),
  ];
  const reasons = new Set(
    progression.suggestions.map((suggestion) => {
      switch (suggestion.reason) {
        case 'add-rep':
          return '+1 rep';
        case 'below-range':
          return 'To range minimum';
        case 'above-target-rpe':
          return 'Repeat: last RPE above target';
        case 'top-range':
          return 'Repeat: top of range';
        case 'add-load': {
          const set = entry.sets.find((item) => item.id === suggestion.setId);
          const unit = set?.entryUnit ?? entry.exercise.defaultEntryUnit;
          return `+${weightText((suggestion.weightKilograms ?? 0) - suggestion.previousWeightKilograms, unit)} next`;
        }
      }
    }),
  );
  if (reasons.size > 1) reasons.delete('Repeat: top of range');
  return [...ranges, ...reasons].join(' · ') || undefined;
}
