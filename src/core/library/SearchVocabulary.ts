import type { Equipment } from './Equipment';
import type { Mechanic } from './Mechanic';
import type { Muscle } from './Muscle';
import type { MovementPattern } from './MovementPattern';

/** A gym word can refer to several related muscles or movement patterns. */
export type SearchConstraint =
  | { readonly kind: 'muscle'; readonly values: readonly Muscle[] }
  | { readonly kind: 'equipment'; readonly values: readonly Equipment[] }
  | { readonly kind: 'pattern'; readonly values: readonly MovementPattern[] }
  | { readonly kind: 'mechanic'; readonly values: readonly Mechanic[] };

/** Heuristic: common gym terms, normalized by SearchText; phrases take precedence over single words. */
export const SearchVocabulary: Readonly<Record<string, SearchConstraint>> = Object.freeze({
  chest: { kind: 'muscle', values: ['chest'] },
  pec: { kind: 'muscle', values: ['chest'] },
  'front delt': { kind: 'muscle', values: ['front-delt'] },
  'anterior delt': { kind: 'muscle', values: ['front-delt'] },
  'side delt': { kind: 'muscle', values: ['side-delt'] },
  'lateral delt': { kind: 'muscle', values: ['side-delt'] },
  'rear delt': { kind: 'muscle', values: ['rear-delt'] },
  'posterior delt': { kind: 'muscle', values: ['rear-delt'] },
  lat: { kind: 'muscle', values: ['lats'] },
  trap: { kind: 'muscle', values: ['upper-traps'] },
  'upper back': { kind: 'muscle', values: ['upper-back'] },
  rhomboid: { kind: 'muscle', values: ['upper-back'] },
  bicep: { kind: 'muscle', values: ['biceps'] },
  tricep: { kind: 'muscle', values: ['triceps'] },
  forearm: { kind: 'muscle', values: ['forearm-flexors', 'forearm-extensors'] },
  abs: { kind: 'muscle', values: ['abs'] },
  core: { kind: 'muscle', values: ['abs'] },
  oblique: { kind: 'muscle', values: ['obliques'] },
  glute: { kind: 'muscle', values: ['glutes'] },
  butt: { kind: 'muscle', values: ['glutes'] },
  quad: { kind: 'muscle', values: ['quads'] },
  quadricep: { kind: 'muscle', values: ['quads'] },
  ham: { kind: 'muscle', values: ['hamstrings'] },
  hamstring: { kind: 'muscle', values: ['hamstrings'] },
  calf: { kind: 'muscle', values: ['calves'] },
  calve: { kind: 'muscle', values: ['calves'] },
  adductor: { kind: 'muscle', values: ['adductors'] },
  'inner thigh': { kind: 'muscle', values: ['adductors'] },
  abductor: { kind: 'muscle', values: ['hip-abductors'] },
  'outer thigh': { kind: 'muscle', values: ['hip-abductors'] },
  'hip flexor': { kind: 'muscle', values: ['hip-flexors'] },
  neck: { kind: 'muscle', values: ['neck'] },
  press: { kind: 'pattern', values: ['horizontal-push', 'vertical-push'] },
  push: { kind: 'pattern', values: ['horizontal-push', 'vertical-push'] },
  pull: { kind: 'pattern', values: ['horizontal-pull', 'vertical-pull', 'shoulder-extension'] },
  row: { kind: 'pattern', values: ['horizontal-pull', 'rear-delt-fly'] },
  fly: { kind: 'pattern', values: ['chest-fly', 'rear-delt-fly'] },
  flye: { kind: 'pattern', values: ['chest-fly', 'rear-delt-fly'] },
  curl: { kind: 'pattern', values: ['elbow-flexion', 'wrist-flexion', 'knee-flexion'] },
  extension: {
    kind: 'pattern',
    values: ['knee-extension', 'elbow-extension', 'wrist-extension', 'spinal-extension', 'shoulder-extension'],
  },
  raise: { kind: 'pattern', values: ['shoulder-abduction', 'shoulder-flexion', 'calf-raise'] },
  squat: { kind: 'pattern', values: ['squat'] },
  hinge: { kind: 'pattern', values: ['hinge'] },
  lunge: { kind: 'pattern', values: ['lunge'] },
  carry: { kind: 'pattern', values: ['carry'] },
  isolation: { kind: 'mechanic', values: ['isolation'] },
  compound: { kind: 'mechanic', values: ['compound'] },
  machine: { kind: 'equipment', values: ['machine'] },
  cable: { kind: 'equipment', values: ['cable'] },
  smith: { kind: 'equipment', values: ['smith-machine'] },
  'smith machine': { kind: 'equipment', values: ['smith-machine'] },
  'plate loaded': { kind: 'equipment', values: ['plate-loaded'] },
  band: { kind: 'equipment', values: ['band'] },
  dumbbell: { kind: 'equipment', values: ['dumbbell'] },
  barbell: { kind: 'equipment', values: ['barbell'] },
  'ez bar': { kind: 'equipment', values: ['ez-bar'] },
  'trap bar': { kind: 'equipment', values: ['trap-bar'] },
  'safety bar': { kind: 'equipment', values: ['safety-bar'] },
  kettlebell: { kind: 'equipment', values: ['kettlebell'] },
  landmine: { kind: 'equipment', values: ['landmine'] },
  plate: { kind: 'equipment', values: ['plate'] },
  bodyweight: { kind: 'equipment', values: ['bodyweight'] },
  weighted: { kind: 'equipment', values: ['weighted'] },
  assisted: { kind: 'equipment', values: ['assisted'] },
});
