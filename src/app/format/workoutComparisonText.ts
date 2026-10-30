import type { PersonalBest } from '../../core/queries/PersonalBests';
import type { WorkoutSet } from '../../core/models/WorkoutSet';
import type { WeightUnit } from '../../core/units/WeightUnit';
import { estimateText } from './estimateText';
import { volumeText, weightNumberText, weightText } from './weightText';

/** Descriptive signed percentage, omitted when the earlier value is zero. */
export function changeText(current: number, previous: number): string {
  if (previous === 0) return '';
  const percent = Math.round(((current - previous) / previous) * 100);
  return ` (${percent > 0 ? '+' : ''}${percent}%)`;
}

/** A current workout volume and its change from the earlier session. */
export function comparisonVolumeText(current: number, previous: number): string {
  return `Volume ${volumeText(current)}${changeText(current, previous)}`;
}

/** A top-set comparison in the exercise's display unit. */
export function topSetText(name: string, previous: WorkoutSet, current: WorkoutSet, unit: WeightUnit): string {
  return `${name}: ${weightNumberText(previous.weightKilograms, unit)} × ${previous.reps} → ${weightNumberText(current.weightKilograms, unit)} × ${current.reps} ${unit}`;
}

/** One plain personal-best line in the exercise's display unit. */
export function personalBestText(best: PersonalBest): string {
  const unit = best.exercise.defaultEntryUnit;
  const labels = {
    e1rm: 'Best e1RM',
    weight: 'Heaviest weight',
    reps: 'Rep best',
    setVolume: 'Best set volume',
    sessionVolume: 'Best session volume',
  };
  const reps = best.reps === null ? '' : ` × ${best.reps}`;
  const amount = best.kind === 'e1rm' ? estimateText : weightText;
  return `${labels[best.kind]} · ${best.exercise.name} · ${amount(best.value, unit)}${reps} (was ${amount(best.previous, unit)}${reps})`;
}
