import type { TemplateDraft } from '../../../core/templates/TemplateDraft';
import type { TargetPad } from './TargetPad';
import type { TemplateEditorActions } from './TemplateEditorActions';

/** Everything the template editor screens need: the draft being edited and what its controls do. */
export interface TemplateEditorModel {
  readonly draft: TemplateDraft;
  readonly pad: TargetPad;
  readonly actions: TemplateEditorActions;
  /** Why the last Save failed, in the template store's own words; `undefined` when all is well. */
  readonly error: string | undefined;
  readonly isSaving: boolean;
  /** Whether the exercise picker is shown in place of the form. */
  readonly isPicking: boolean;
  setName(name: string): void;
  /** `null` for no folder. */
  setFolder(folderId: number | null): void;
  setNotes(notes: string): void;
  startPicking(): void;
  stopPicking(): void;
  /** Appends the picked exercises and returns to the form. */
  addPicked(exerciseIds: readonly number[]): void;
  dismissError(): void;
  save(): void;
}
