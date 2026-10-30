import { useEffect, useRef } from 'react';
import type { WorkoutSet } from '../../../core/models/WorkoutSet';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { SwipeToDelete } from '../../design/components/SwipeToDelete';
import type { EditedCell } from './CellEditor';
import { CheckButton } from './CheckButton';
import type { ExerciseCardActions } from './ExerciseCardActions';
import { SetCell } from './SetCell';
import { previousText } from './setCellText';
import grid from './SetGrid.module.css';
import { SetKindMenu } from './SetKindMenu';
import styles from './SetRow.module.css';
import { isBodyweightLoad, recordsWeight } from './trackingKinds';

/**
 * One set: its label, last session's numbers, the editable cells and the check. It draws what it is
 * given and reports taps; the screen decides what they do.
 */
export function SetRow({
  entry,
  set,
  label,
  previous,
  editing,
  actions,
}: {
  readonly entry: LiveWorkoutEntry;
  readonly set: WorkoutSet;
  /** "1", "2"…, or "W", "D", "F". */
  readonly label: string;
  /** The set done at the same position last session, if any. */
  readonly previous: WorkoutSet | undefined;
  /** The cell of this row the pad is typing into, if any. */
  readonly editing: EditedCell | undefined;
  readonly actions: ExerciseCardActions;
}) {
  const { tracking, defaultEntryUnit } = entry.exercise;
  const row = useRef<HTMLDivElement>(null);
  const isEditingRow = editing !== undefined;

  // Brings the row into view above the pad when the pad opens on it.
  useEffect(() => {
    if (isEditingRow) row.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [isEditingRow]);

  // A set typed in the other unit shows its own unit beside the number, so it is never misread.
  const isInOtherUnit =
    set.entryUnit !== defaultEntryUnit && !(isBodyweightLoad(tracking) && set.weightKilograms === 0);
  const edit = (field: 'weight' | 'reps' | 'rpe') => () => actions.edit(set.id, field);

  return (
    <SwipeToDelete label="Delete set" onDelete={() => actions.deleteSet(set.id)}>
      <div
        ref={row}
        className={`${grid.grid} ${styles.row}`}
        data-weight={recordsWeight(tracking)}
        data-completed={set.isCompleted}
      >
        <SetKindMenu
          label={label}
          kind={set.kind}
          onSelectKind={(kind) => actions.selectKind(set.id, kind)}
          onDelete={() => actions.deleteSet(set.id)}
        />
        <span className={styles.previous}>
          {previous === undefined ? '—' : previousText(previous, tracking, set.entryUnit)}
        </span>
        {recordsWeight(tracking) && (
          <SetCell
            set={set}
            field="weight"
            tracking={tracking}
            editing={editing}
            {...(isInOtherUnit ? { unitSuffix: set.entryUnit } : {})}
            onPress={edit('weight')}
          />
        )}
        <SetCell set={set} field="reps" tracking={tracking} editing={editing} onPress={edit('reps')} />
        <SetCell set={set} field="rpe" tracking={tracking} editing={editing} onPress={edit('rpe')} />
        <CheckButton isCompleted={set.isCompleted} onPress={() => actions.toggleCompleted(entry, set)} />
      </div>
    </SwipeToDelete>
  );
}
