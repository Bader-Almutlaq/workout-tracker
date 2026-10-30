import type { TemplateFolderSummary, TemplateSummary } from '../../../core/queries/TemplateCatalog';

/** Which question or sheet is open over the template list; at most one at a time. */
export type TemplateDialogState =
  | { readonly kind: 'preview'; readonly templateId: number }
  | { readonly kind: 'newFolder' }
  | { readonly kind: 'renameFolder'; readonly folder: TemplateFolderSummary }
  | { readonly kind: 'deleteFolder'; readonly folder: TemplateFolderSummary }
  | { readonly kind: 'moveTemplate'; readonly template: TemplateSummary }
  | { readonly kind: 'deleteTemplate'; readonly template: TemplateSummary };
