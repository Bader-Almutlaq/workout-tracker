import type { Muscle } from './Muscle';

/** Heuristic: the owner's smaller-muscle list is hidden from normal coverage results. */
export const SMALLER_MUSCLES: readonly Muscle[] = Object.freeze([
  'rotator-cuff',
  'neck',
  'serratus',
  'brachialis',
  'brachioradialis',
  'tibialis',
  'lower-traps',
  'hip-flexors',
]);

/** Whether a muscle belongs in the owner's normal coverage results. */
export function isMainMuscle(muscle: Muscle): boolean {
  return !SMALLER_MUSCLES.includes(muscle);
}
