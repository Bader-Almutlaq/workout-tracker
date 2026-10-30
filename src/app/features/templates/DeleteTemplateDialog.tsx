import type { TemplateSummary } from '../../../core/queries/TemplateCatalog';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';

/** The question before deleting a template. Workouts already done from it stay in History. */
export function DeleteTemplateDialog({
  template,
  onConfirm,
  onCancel,
}: {
  readonly template: TemplateSummary;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <ConfirmDialog title={`Delete “${template.name}”?`} confirmLabel="Delete" onConfirm={onConfirm} onCancel={onCancel}>
      Workouts you did from it stay in History.
    </ConfirmDialog>
  );
}
