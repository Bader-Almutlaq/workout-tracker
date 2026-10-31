import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { ActionMenuItem } from '../../design/components/ActionMenuRow';

/** The live warm-up action, disabled with a hint until the first work set has a positive load. */
export function warmupMenuItem(sets: readonly WorkoutSet[], toggle: (remove: boolean) => void): ActionMenuItem {
  const hasWarmups = sets.some((set) => set.kind === 'warmup');
  const hasWorkingWeight = (sets.find((set) => set.kind !== 'warmup')?.weightKilograms ?? 0) > 0;
  return {
    label: hasWarmups
      ? 'Remove suggested warm-ups'
      : hasWorkingWeight
        ? 'Add warm-up sets'
        : 'Add warm-up sets (enter a working weight first)',
    isDisabled: !hasWarmups && !hasWorkingWeight,
    onSelect: () => toggle(hasWarmups),
  };
}
