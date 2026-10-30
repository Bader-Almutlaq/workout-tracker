import { MUSCLE_DISPLAY_NAMES, MUSCLE_REGION_OF, MUSCLES, type Muscle } from '../../../core/library/Muscle';
import { MUSCLE_REGION_DISPLAY_NAMES, MUSCLE_REGIONS } from '../../../core/library/MuscleRegion';

/** The muscles of one body region, in head-to-toe order. */
export interface MuscleGroup {
  /** The region's display name, e.g. "Shoulders". */
  readonly label: string;
  readonly muscles: readonly { readonly muscle: Muscle; readonly label: string }[];
}

/** Every muscle grouped by body region, regions head to toe; the one place lists and pickers get their grouping. */
export const MUSCLE_GROUPS: readonly MuscleGroup[] = MUSCLE_REGIONS.map((region) => ({
  label: MUSCLE_REGION_DISPLAY_NAMES[region],
  muscles: MUSCLES.filter((muscle) => MUSCLE_REGION_OF[muscle] === region).map((muscle) => ({
    muscle,
    label: MUSCLE_DISPLAY_NAMES[muscle],
  })),
}));
