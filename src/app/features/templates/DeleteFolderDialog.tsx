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
      title={`Delete plan “${folder.name}”?`}
      confirmLabel="Delete plan"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      Its workouts are kept under Other workouts. Sessions stay in History.
    </ConfirmDialog>
  );
}
