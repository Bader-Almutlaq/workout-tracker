import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * A modal question with a confirm and a cancel button, drawn with the browser's `<dialog>` so focus
 * stays inside it and the Escape key cancels. Render it only while the question is open.
 * `cancelLabel` renames the second button ("Cancel" by default) when the safe answer has another name.
 */
export function ConfirmDialog({
  title,
  confirmLabel,
  cancelLabel = 'Cancel',
  isBusy = false,
  onConfirm,
  onCancel,
  onDismiss,
  children,
}: {
  readonly title: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly isBusy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  /** Escape action when different from the secondary button. */
  readonly onDismiss?: () => void;
  readonly children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        (onDismiss ?? onCancel)();
      }}
    >
      <h2 className={styles.title}>{title}</h2>
      {children !== undefined && <div className={styles.body}>{children}</div>}
      <div className={styles.actions}>
        <Button variant="primary" isDisabled={isBusy} onPress={onConfirm}>
          {confirmLabel}
        </Button>
        <Button isDisabled={isBusy} onPress={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </dialog>
  );
}
