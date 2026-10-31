import { displayValue } from '../../../core/units/Weight';
import { progressionValueSuggestion } from './progressionValueSuggestion';
import type { ValueSuggestion } from './ValueSuggestion';
import type { Field } from './Cell';
import { cellText } from './setCellText';
import { recordsDuration } from './trackingKinds';
import type { WeightUnit } from '../../../core/units/WeightUnit';
import { WorkoutTextField } from './WorkoutTextField';
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
  isSuggested = false,
  separatesWarmups = false,
  onNotesChange,
  isPastWorkout = false,
  displayUnit,
  showsEmptyRpe = false,
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
  readonly isSuggested?: boolean;
  readonly separatesWarmups?: boolean;
  /** History retains completed state and exposes per-set notes without a logging toggle. */
  readonly isPastWorkout?: boolean;
  /** The card header unit, so mixed imported units are always identified correctly. */
  readonly displayUnit?: WeightUnit;
  /** Live exercise-level opt-in to empty RPE badges. */
  readonly showsEmptyRpe?: boolean;
  readonly onNotesChange?: (notes: string) => void;
}) {
  const { tracking } = entry.exercise;
  const defaultEntryUnit = displayUnit ?? entry.exercise.defaultEntryUnit;
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
  const isPrefilled = (field: Field) =>
    !isPastWorkout && !set.isCompleted && actions.isValueEntered?.(set.id, field) !== true;
  const suggestion = (field: 'weight' | 'reps'): ValueSuggestion | undefined => {
    const apply = actions.applySuggestion;
    if (!isPrefilled(field) || apply === undefined || isPastWorkout) return undefined;
    if (entry.deload !== undefined && field === 'reps' && recordsDuration(tracking)) return undefined;
    const progression = (entry.deload ?? entry.progression)?.suggestions.find((item) => item.setId === set.id);
    // A deload can be enabled after template prefill chose a different session. Showing it never changes that saved value.
    const reference = entry.deload === undefined ? previous : set;
    if (progression !== undefined && reference !== undefined) {
      return progressionValueSuggestion(progression, set, reference, field, (value) => apply(set.id, field, value));
    }
    if (!isSuggested) return undefined;
    return {
      value:
        field === 'weight'
          ? displayValue(set.weightKilograms, set.entryUnit)
          : recordsDuration(tracking)
            ? (set.durationSeconds ?? 0)
            : set.reps,
      text: cellText(set, field, tracking),
      onAccept: (value) => apply(set.id, field, value),
    };
  };

  return (
    <SwipeToDelete label="Delete set" onDelete={() => actions.deleteSet(set.id)}>
      <div
        ref={row}
        className={`${grid.grid} ${styles.row}`}
        data-weight={recordsWeight(tracking)}
        data-past={isPastWorkout}
        data-completed={set.isCompleted}
        data-warmup={set.kind === 'warmup'}
        data-separator={separatesWarmups}
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
            isSuggested={isPrefilled('weight')}
            suggestion={suggestion('weight')}
            tracking={tracking}
            editing={editing}
            {...(isInOtherUnit ? { unitSuffix: set.entryUnit } : {})}
            onPress={edit('weight')}
          />
        )}
        <SetCell
          isSuggested={isPrefilled('reps')}
          suggestion={suggestion('reps')}
          set={set}
          field="reps"
          tracking={tracking}
          editing={editing}
          onPress={edit('reps')}
        />
        {isPastWorkout && <SetCell set={set} field="rpe" tracking={tracking} editing={editing} onPress={edit('rpe')} />}
        <CheckButton
          isCompleted={set.isCompleted}
          isDisabled={isPastWorkout}
          {...(isPastWorkout ? {} : { rpe: set.rpe, showsEmptyRpe, onEditRpe: edit('rpe') })}
          onPress={() => actions.toggleCompleted(entry, set)}
        />
      </div>
      {onNotesChange !== undefined && (
        <WorkoutTextField isMultiline label={`Set ${label} notes`} value={set.notes ?? ''} onSave={onNotesChange} />
      )}
    </SwipeToDelete>
  );
}
