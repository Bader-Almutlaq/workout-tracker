import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import styles from './BottomSheet.module.css';

/**
 * A panel that slides up from the bottom edge over the screen, drawn with the browser's `<dialog>`
 * so focus stays inside it and Escape closes it. Pressing outside it closes it too. Render it only
 * while it is open. `children` is the body, which scrolls when it is long; put the actions after it.
 */
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);

  const closeOnBackdropPress = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog ref={dialog} className={styles.sheet} onCancel={onClose} onClick={closeOnBackdropPress}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
