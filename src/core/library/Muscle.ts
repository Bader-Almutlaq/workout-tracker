import type { MuscleRegion } from './MuscleRegion';

/**
 * Every muscle the app counts sets for, head to toe. The slugs are stable: they are stored in
 * the `muscle` table (frozen in the `v1-schema` migration) and in `library.json`, so never rename one.
 *
 * The research report recommends about 20 muscles with the front, side and rear delts separated,
 * because neither open dataset splits the shoulder and set counts for side and rear delts are what
 * most programmes under-dose (report, "Two open databases give you about 1,200–1,500 exercises").
 * The forearm is split into flexors and extensors because the owner trains both directly.
 *
 * - `upper-back`: rhomboids plus middle and lower trapezius, what rows and face pulls train besides the lats.
 * - `upper-traps`: upper trapezius, what shrugs train.
 * - `lower-back`: spinal erectors.
 * - `biceps`: biceps brachii and brachialis.
 * - `forearm-flexors`: wrist and finger flexors, for wrist curls and grip work.
 * - `forearm-extensors`: wrist extensors and brachioradialis, for reverse wrist curls, reverse and hammer curls.
 * - `hip-abductors`: gluteus medius and minimus, what the hip abductor machine trains.
 */
export const MUSCLES = [
  'chest',
  'front-delt',
  'side-delt',
  'rear-delt',
  'rotator-cuff',
  'lats',
  'upper-back',
  'upper-traps',
  'lower-back',
  'biceps',
  'triceps',
  'forearm-flexors',
  'forearm-extensors',
  'abs',
  'obliques',
  'hip-flexors',
  'glutes',
  'hip-abductors',
  'adductors',
  'quads',
  'hamstrings',
  'calves',
  'neck',
] as const;

/** A muscle slug; one of `MUSCLES`. */
export type Muscle = (typeof MUSCLES)[number];

/** Name of each muscle shown in the UI. Matches `muscle.name` in the `v1-schema` migration. */
export const MUSCLE_DISPLAY_NAMES: Readonly<Record<Muscle, string>> = {
  chest: 'Chest',
  'front-delt': 'Front delts',
  'side-delt': 'Side delts',
  'rear-delt': 'Rear delts',
  'rotator-cuff': 'Rotator cuff',
  lats: 'Lats',
  'upper-back': 'Upper back',
  'upper-traps': 'Upper traps',
  'lower-back': 'Lower back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  'forearm-flexors': 'Forearm flexors',
  'forearm-extensors': 'Forearm extensors',
  abs: 'Abs',
  obliques: 'Obliques',
  'hip-flexors': 'Hip flexors',
  glutes: 'Glutes',
  'hip-abductors': 'Hip abductors',
  adductors: 'Adductors',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  neck: 'Neck',
};

/** The body area each muscle is listed under. Matches `muscle.region` in the `v1-schema` migration. */
export const MUSCLE_REGION_OF: Readonly<Record<Muscle, MuscleRegion>> = {
  chest: 'chest',
  'front-delt': 'shoulders',
  'side-delt': 'shoulders',
  'rear-delt': 'shoulders',
  'rotator-cuff': 'shoulders',
  lats: 'back',
  'upper-back': 'back',
  'upper-traps': 'back',
  'lower-back': 'back',
  biceps: 'arms',
  triceps: 'arms',
  'forearm-flexors': 'arms',
  'forearm-extensors': 'arms',
  abs: 'core',
  obliques: 'core',
  'hip-flexors': 'core',
  glutes: 'legs',
  'hip-abductors': 'legs',
  adductors: 'legs',
  quads: 'legs',
  hamstrings: 'legs',
  calves: 'legs',
  neck: 'neck',
};

/**
 * Orders muscles head to toe (the order of `MUSCLES`), which is how lists show them.
 * Usable directly as an `Array.prototype.sort` comparator.
 */
export function compareMuscles(left: Muscle, right: Muscle): number {
  return MUSCLES.indexOf(left) - MUSCLES.indexOf(right);
}
