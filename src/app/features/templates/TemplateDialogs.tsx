import { useNavigate } from 'react-router';
import type { TemplateList } from '../../../core/queries/TemplateCatalog';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { DeleteTemplateDialog } from './DeleteTemplateDialog';
import { FolderNameDialog } from './FolderNameDialog';
import { MoveTemplateDialog } from './MoveTemplateDialog';
import { createFolder, deleteFolder, deleteTemplate, moveTemplate, renameFolder } from './templateActions';
import type { TemplateDialogState } from './templateDialogState';
import { templatePath } from './templatePaths';
import { TemplatePreviewSheet } from './TemplatePreviewSheet';

/** Whichever question or sheet is open over the template list, if any. Every answer closes it. */
export function TemplateDialogs({
  dialog,
  list,
  isBusy,
  onStart,
  onClose,
}: {
  readonly dialog: TemplateDialogState | undefined;
  readonly list: TemplateList;
  readonly isBusy: boolean;
  /** Starts a workout from the template. */
  readonly onStart: (templateId: number) => void;
  readonly onClose: () => void;
}) {
  const navigate = useNavigate();
  if (dialog === undefined) return null;
  // Every answer does its work, then closes the dialog.
  const answer =
    <Args extends unknown[]>(action: (...args: Args) => void) =>
    (...args: Args) => {
      action(...args);
      onClose();
    };
  switch (dialog.kind) {
    case 'preview': {
      const { templateId } = dialog;
      const summary = [...list.unfiled, ...list.folders.flatMap((folder) => folder.templates)].find(
        (template) => template.id === templateId,
      );
      return (
        <TemplatePreviewSheet
          templateId={templateId}
          name={summary?.name ?? 'Workout'}
          isBusy={isBusy}
          onStart={answer(() => onStart(templateId))}
          onEdit={() => navigate(templatePath(templateId))}
          onClose={onClose}
        />
      );
    }
    case 'newFolder':
      return (
        <FolderNameDialog
          title="New plan"
          confirmLabel="Create"
          initialName=""
          onConfirm={answer(createFolder)}
          onCancel={onClose}
        />
      );
    case 'renameFolder': {
      const { folder } = dialog;
      return (
        <FolderNameDialog
          title="Rename plan"
          confirmLabel="Rename"
          initialName={folder.name}
          onConfirm={answer((name: string) => renameFolder(folder.id, name))}
          onCancel={onClose}
        />
      );
    }
    case 'deleteFolder': {
      const { folder } = dialog;
      return (
        <DeleteFolderDialog folder={folder} onConfirm={answer(() => deleteFolder(folder.id))} onCancel={onClose} />
      );
    }
    case 'moveTemplate': {
      const { template } = dialog;
      return (
        <MoveTemplateDialog
          template={template}
          folders={list.folders}
          onMove={answer((folderId: number | null) => moveTemplate(template.id, folderId))}
          onCancel={onClose}
        />
      );
    }
    case 'deleteTemplate': {
      const { template } = dialog;
      return (
        <DeleteTemplateDialog
          template={template}
          onConfirm={answer(() => deleteTemplate(template.id))}
          onCancel={onClose}
        />
      );
    }
  }
}
