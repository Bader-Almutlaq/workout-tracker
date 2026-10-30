import { ArrowDown, ArrowUp, Ellipsis, Trash2 } from 'lucide-react';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { ActionMenu } from '../../design/components/ActionMenu';
import type { ExerciseCardActions } from './ExerciseCardActions';
import styles from './ExerciseCardHeader.module.css';
import { recordsWeight } from './trackingKinds';
import { UnitChip } from './UnitChip';

/** The top of an exercise card: its name, the kg/lb chip and the "…" menu (move up, move down, remove). */
export function ExerciseCardHeader({
  entry,
  index,
  count,
  actions,
}: {
  readonly entry: LiveWorkoutEntry;
  /** Position in the workout (0-based) and the number of exercises, to disable Move up / Move down at the ends. */
  readonly index: number;
  readonly count: number;
  readonly actions: ExerciseCardActions;
}) {
  const { exercise } = entry;
  const entryId = entry.entry.id;
  return (
    <div className={styles.header}>
      <h2 className={styles.name}>{exercise.name}</h2>
      {recordsWeight(exercise.tracking) && (
        <UnitChip unit={exercise.defaultEntryUnit} onSwitch={(unit) => actions.switchUnit(entryId, unit)} />
      )}
      <ActionMenu
        label="Exercise options"
        items={[
          { label: 'Move up', icon: ArrowUp, isDisabled: index === 0, onSelect: () => actions.move(entryId, -1) },
          {
            label: 'Move down',
            icon: ArrowDown,
            isDisabled: index === count - 1,
            onSelect: () => actions.move(entryId, 1),
          },
          {
            label: 'Remove exercise',
            icon: Trash2,
            isDestructive: true,
            onSelect: () => actions.requestRemoval(entry),
          },
        ]}
      >
        <Ellipsis size={20} strokeWidth={2} aria-hidden />
      </ActionMenu>
    </div>
  );
}
