import { Flame } from 'lucide-react';
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
        ? 'Add suggested warm-ups'
        : 'Add suggested warm-ups (enter a working weight first)',
    icon: Flame,
    isDisabled: !hasWarmups && !hasWorkingWeight,
    onSelect: () => toggle(hasWarmups),
  };
}
