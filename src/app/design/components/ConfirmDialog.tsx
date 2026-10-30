import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * A modal question with a confirm and a cancel button, drawn with the browser's `<dialog>` so focus
 * stays inside it and the Escape key cancels. Render it only while the question is open.
 */
export function ConfirmDialog({
  title,
  confirmLabel,
  isBusy = false,
  onConfirm,
  onCancel,
  children,
}: {
  readonly title: string;
  readonly confirmLabel: string;
  readonly isBusy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);

  return (
    <dialog ref={dialog} className={styles.dialog} onCancel={onCancel}>
      <h2 className={styles.title}>{title}</h2>
      {children !== undefined && <div className={styles.body}>{children}</div>}
      <div className={styles.actions}>
        <Button variant="primary" isDisabled={isBusy} onPress={onConfirm}>
          {confirmLabel}
        </Button>
        <Button isDisabled={isBusy} onPress={onCancel}>
          Cancel
        </Button>
      </div>
    </dialog>
  );
}
