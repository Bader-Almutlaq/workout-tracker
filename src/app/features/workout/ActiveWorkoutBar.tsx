import { Ellipsis, Trash2 } from 'lucide-react';
import { ActionMenu } from '../../design/components/ActionMenu';
import styles from './ActiveWorkoutBar.module.css';
import { ElapsedClock } from './ElapsedClock';

/** The bar that stays at the top while the sets scroll: the clock, the "…" menu (discard) and Finish. */
export function ActiveWorkoutBar({
  startedAt,
  onFinish,
  onDiscard,
}: {
  readonly startedAt: string;
  readonly onFinish: () => void;
  readonly onDiscard: () => void;
}) {
  return (
    <div className={styles.bar}>
      <ElapsedClock startedAt={startedAt} />
      <div className={styles.actions}>
        <ActionMenu
          label="Workout options"
          items={[{ label: 'Discard workout', icon: Trash2, isDestructive: true, onSelect: onDiscard }]}
        >
          <Ellipsis size={20} strokeWidth={2} aria-hidden />
        </ActionMenu>
        <button type="button" className={styles.finish} onClick={onFinish}>
          Finish
        </button>
      </div>
    </div>
  );
}
