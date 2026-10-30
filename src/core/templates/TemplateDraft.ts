import type { SetKind } from '../models/SetKind';

/** A planned set; null targets are unspecified. */
export interface TemplateSetDraft {
  readonly kind: SetKind;
  readonly targetRepsLow: number | null;
  readonly targetRepsHigh: number | null;
  readonly targetRpe: number | null;
}
/** An exercise in its editor order, with its planned sets. */
export interface TemplateExerciseDraft {
  readonly exerciseId: number;
  readonly supersetGroup: number | null;
  readonly notes: string | null;
  readonly sets: readonly TemplateSetDraft[];
}
/** Editable template data; id is absent for a new template. */
export interface TemplateDraft {
  readonly id?: number;
  readonly name: string;
  readonly folderId: number | null;
  readonly notes: string | null;
  readonly exercises: readonly TemplateExerciseDraft[];
}
