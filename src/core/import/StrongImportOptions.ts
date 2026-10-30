import type { WeightUnit } from '../units/WeightUnit';

/** A replacement value for one set, from the typo review. */
export interface SetCorrection {
  /** Corrected load in kilograms; absent to keep the original. */
  readonly weightKilograms?: number;
  /** Corrected reps; absent to keep the original. */
  readonly reps?: number;
}

/** The owner's decisions in the import review, applied when building a `StrongImportPlan`. */
export interface StrongImportOptions {
  /** Column unit chosen by the owner for an exercise, overriding `resolveExportUnit`. Keyed by exercise name. */
  readonly unitOverrides: ReadonlyMap<string, WeightUnit>;
  /** Corrections keyed by the set's line number in the export. */
  readonly corrections: ReadonlyMap<number, SetCorrection>;
  /** Set lines to leave out of the import. */
  readonly excludedLines: ReadonlySet<number>;
  /** Lines the owner confirmed as correct; they are no longer flagged. */
  readonly confirmedLines: ReadonlySet<number>;
}

/** Import options with no decisions made, unless `decisions` says otherwise. */
export function makeImportOptions(decisions: Partial<StrongImportOptions> = {}): StrongImportOptions {
  return {
    unitOverrides: decisions.unitOverrides ?? new Map(),
    corrections: decisions.corrections ?? new Map(),
    excludedLines: decisions.excludedLines ?? new Set(),
    confirmedLines: decisions.confirmedLines ?? new Set(),
  };
}
