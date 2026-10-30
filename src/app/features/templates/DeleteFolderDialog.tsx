import type { TemplateFolderSummary } from '../../../core/queries/TemplateCatalog';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';

/** The question before deleting a folder. Its templates are kept, moved out of any folder. */
export function DeleteFolderDialog({
  folder,
  onConfirm,
  onCancel,
}: {
  readonly folder: TemplateFolderSummary;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      title={`Delete folder “${folder.name}”?`}
      confirmLabel="Delete folder"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      Its templates are kept, and move out of any folder.
    </ConfirmDialog>
  );
}
