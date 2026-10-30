/**
 * Every role a set can play, as stored in `workoutSet.kind`.
 * - `warmup`: excluded from volume and e1RM.
 * - `working`: a normal working set.
 * - `drop`: a drop set (load reduced without rest).
 * - `failure`: a set taken to failure (RIR 0).
 */
export const SET_KINDS = ['warmup', 'working', 'drop', 'failure'] as const;

/** What role a set plays. Stored as text in `workoutSet.kind`. */
export type SetKind = (typeof SET_KINDS)[number];

/** Whether the set counts as training work (everything except warm-ups). */
export function isWorkSetKind(kind: SetKind): boolean {
  return kind !== 'warmup';
}
