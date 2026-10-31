import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../../design/components/Button';
import styles from './WorkoutSheet.module.css';

/** Workout-specific dialog shell: title and edit above an independent scroller, Start pinned below it. */
export function WorkoutSheet({
  title,
  isBusy,
  canStart,
  onStart,
  onEdit,
  onClose,
  children,
}: {
  readonly title: string;
  readonly isBusy: boolean;
  readonly canStart: boolean;
  readonly onStart: () => void;
  readonly onEdit: () => void;
  readonly onClose: () => void;
  readonly children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.sheet}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className={styles.header}>
        <h2>{title}</h2>
        <div className={styles.actions}>
          <Button isDisabled={!canStart} onPress={onEdit}>
            Edit
          </Button>
          <Button onPress={onClose}>Close</Button>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
      <footer className={styles.footer}>
        <Button variant="primary" isDisabled={isBusy || !canStart} onPress={onStart}>
          Start workout
        </Button>
      </footer>
    </dialog>
  );
}
