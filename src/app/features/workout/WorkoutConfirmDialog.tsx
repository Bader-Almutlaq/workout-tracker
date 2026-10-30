import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { confirmationText, type Confirmation } from './confirmation';

/** The question before finishing with planned sets, discarding the workout or removing an exercise that has completed sets. */
export function WorkoutConfirmDialog({
  confirmation,
  onConfirm,
  onCancel,
}: {
  readonly confirmation: Confirmation;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const { title, message, confirmLabel } = confirmationText(confirmation);
  return (
    <ConfirmDialog title={title} confirmLabel={confirmLabel} onConfirm={onConfirm} onCancel={onCancel}>
      {message}
    </ConfirmDialog>
  );
}
