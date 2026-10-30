import { SET_KINDS, type SetKind } from '../../../core/models/SetKind';

/** Name of each set kind in the menu on the set label. */
export const SET_KIND_NAMES: Readonly<Record<SetKind, string>> = {
  working: 'Working set',
  warmup: 'Warm-up',
  drop: 'Drop set',
  failure: 'Failure',
};

/** The kinds in menu order. */
export const SET_KIND_CHOICES: readonly SetKind[] = SET_KINDS;
