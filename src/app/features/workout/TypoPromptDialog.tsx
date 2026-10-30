import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import type { TypoPrompt } from './typoPrompt';

/**
 * "Is this right?" for a set whose numbers look like a typo. Escape means Fix, the safe answer:
 * the set stays planned and the pad opens on the doubtful number.
 */
export function TypoPromptDialog({
  prompt,
  onSaveAnyway,
  onFix,
}: {
  readonly prompt: TypoPrompt;
  readonly onSaveAnyway: () => void;
  readonly onFix: () => void;
}) {
  return (
    <ConfirmDialog
      title="Is this right?"
      confirmLabel="Save anyway"
      cancelLabel="Fix"
      onConfirm={onSaveAnyway}
      onCancel={onFix}
    >
      {prompt.message}
    </ConfirmDialog>
  );
}
