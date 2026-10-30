import type { SetKind } from './SetKind';

/** A TemplateSet record as stored in SQLite; positions are zero-based and dates are UTC ISO strings. */
export interface TemplateSet {
  readonly id: number;
  readonly templateExerciseId: number;
  readonly position: number;
  readonly kind: SetKind;
  readonly targetRepsLow: number | null;
  readonly targetRepsHigh: number | null;
  readonly targetRpe: number | null;
}

/** Raw SQLite row for TemplateSet. */
export type TemplateSetRow = TemplateSet;

/** Converts a raw row into a TemplateSet. */
export function fromTemplateSetRow(row: TemplateSetRow): TemplateSet {
  return { ...row };
}
