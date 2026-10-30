import type { TemplateFolderSummary, TemplateSummary } from '../../../core/queries/TemplateCatalog';

/** What a tap in the template list can do. The list draws and reports; the section decides. */
export interface TemplateListActions {
  /** Opens the preview sheet with Start and Edit. */
  preview(template: TemplateSummary): void;
  duplicate(template: TemplateSummary): void;
  /** Asks which folder to move the template to. */
  requestMove(template: TemplateSummary): void;
  /** Asks before deleting the template. */
  requestDelete(template: TemplateSummary): void;
  renameFolder(folder: TemplateFolderSummary): void;
  /** Moves the folder one place up (`-1`) or down (`1`) among the folders. */
  moveFolder(folder: TemplateFolderSummary, direction: 1 | -1): void;
  /** Asks before deleting the folder (its templates are kept). */
  requestFolderDelete(folder: TemplateFolderSummary): void;
}
