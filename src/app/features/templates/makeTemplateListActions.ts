import type { TemplateList } from '../../../core/queries/TemplateCatalog';
import type { TemplateListActions } from './TemplateListActions';
import type { TemplateDialogState } from './templateDialogState';
import { duplicateTemplate, moveFolder, reorderTemplate } from './templateActions';

/** Existing list operations shared by the Workout tab and pushed plan page; failures use the logging banner. */
export function makeTemplateListActions(
  list: TemplateList,
  setDialog: (dialog: TemplateDialogState) => void,
): TemplateListActions {
  return {
    preview: (template) => setDialog({ kind: 'preview', templateId: template.id }),
    duplicate: (template) => duplicateTemplate(template.id),
    reorder: (template, position) => reorderTemplate(template.id, position),
    requestMove: (template) => setDialog({ kind: 'moveTemplate', template }),
    requestDelete: (template) => setDialog({ kind: 'deleteTemplate', template }),
    renameFolder: (folder) => setDialog({ kind: 'renameFolder', folder }),
    moveFolder: (folder, direction) =>
      moveFolder(folder.id, list.folders.findIndex((candidate) => candidate.id === folder.id) + direction),
    requestFolderDelete: (folder) => setDialog({ kind: 'deleteFolder', folder }),
  };
}
