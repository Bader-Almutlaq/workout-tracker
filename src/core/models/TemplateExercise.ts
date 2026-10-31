/** A TemplateExercise record as stored in SQLite; positions are zero-based and dates are UTC ISO strings. */
export interface TemplateExercise {
  readonly id: number;
  readonly templateId: number;
  readonly exerciseId: number;
  readonly position: number;
  readonly supersetGroup: number | null;
  readonly notes: string | null;
  /** Manufacturer, or null when not recorded. */
  readonly machineBrand?: string | null;
  /** Null disables suggestions; double progresses reps before load for this template only. */
  readonly progression: 'double' | null;
}

/** Raw SQLite row for TemplateExercise. */
export type TemplateExerciseRow = TemplateExercise;

/** Converts a raw row into a TemplateExercise. */
export function fromTemplateExerciseRow(row: TemplateExerciseRow): TemplateExercise {
  return { ...row };
}
