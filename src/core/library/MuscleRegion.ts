/** The body areas muscles are grouped under in lists and filters, in head-to-toe order. */
export const MUSCLE_REGIONS = ['chest', 'shoulders', 'back', 'arms', 'core', 'legs', 'neck'] as const;

/** The body area a `Muscle` belongs to. Values match `muscle.region` in the `v1-schema` migration. */
export type MuscleRegion = (typeof MUSCLE_REGIONS)[number];

/** Name of each region shown in the UI. */
export const MUSCLE_REGION_DISPLAY_NAMES: Readonly<Record<MuscleRegion, string>> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  back: 'Back',
  arms: 'Arms',
  core: 'Core',
  legs: 'Legs',
  neck: 'Neck',
};
