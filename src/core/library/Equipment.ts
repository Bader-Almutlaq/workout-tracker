/**
 * Everything an exercise can be performed with. The slugs are stable: they are stored in the
 * `exercise.equipment` column and in `library.json`.
 *
 * - `machine`: selectorised (pin-loaded) machine.
 * - `plate`: a single weight plate held in the hands.
 * - `bodyweight`: no external load; the exercise name carries no "(…)" suffix, as in Strong.
 * - `weighted`: bodyweight plus a belt, vest or dumbbell.
 * - `assisted`: bodyweight with machine or band assistance.
 */
export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'ez-bar',
  'trap-bar',
  'safety-bar',
  'smith-machine',
  'cable',
  'machine',
  'plate-loaded',
  'landmine',
  'kettlebell',
  'band',
  'plate',
  'bodyweight',
  'weighted',
  'assisted',
] as const;

/** An equipment slug; one of `EQUIPMENT`. */
export type Equipment = (typeof EQUIPMENT)[number];

/** The text shown in an exercise name's brackets, e.g. "Bench Press (**Smith Machine**)". */
export const EQUIPMENT_DISPLAY_NAMES: Readonly<Record<Equipment, string>> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  'ez-bar': 'EZ Bar',
  'trap-bar': 'Trap Bar',
  'safety-bar': 'Safety Bar',
  'smith-machine': 'Smith Machine',
  cable: 'Cable',
  machine: 'Machine',
  'plate-loaded': 'Plate Loaded',
  landmine: 'Landmine',
  kettlebell: 'Kettlebell',
  band: 'Band',
  plate: 'Plate',
  bodyweight: 'Bodyweight',
  weighted: 'Weighted',
  assisted: 'Assisted',
};
