import { Plus } from 'lucide-react';
import { matchPreviousSets } from '../../../core/queries/PreviousPerformance';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { setLabels } from '../../format/setText';
import type { EditedCell } from './CellEditor';
import styles from './ExerciseCard.module.css';
import { ExerciseCardHeader } from './ExerciseCardHeader';
import type { ExerciseCardActions } from './ExerciseCardActions';
import { SetColumnHeader } from './SetColumnHeader';
import { SetRow } from './SetRow';

/** One exercise in the workout being logged: its name, unit chip, column titles, set rows and "Add set". */
export function ExerciseCard({
  entry,
  index,
  count,
  editing,
  actions,
}: {
  readonly entry: LiveWorkoutEntry;
  readonly index: number;
  readonly count: number;
  /** The cell being edited, if it is in this exercise. */
  readonly editing: EditedCell | undefined;
  readonly actions: ExerciseCardActions;
}) {
  const labels = setLabels(entry.sets);
  const previousSets = matchPreviousSets(entry.sets, entry.previous);
  return (
    <section className={styles.card} aria-label={entry.exercise.name}>
      <ExerciseCardHeader entry={entry} index={index} count={count} actions={actions} />
      <SetColumnHeader tracking={entry.exercise.tracking} unit={entry.exercise.defaultEntryUnit} />
      {entry.sets.map((set, position) => (
        <SetRow
          key={set.id}
          entry={entry}
          set={set}
          label={labels[position] ?? ''}
          previous={previousSets[position]}
          editing={editing?.set.id === set.id ? editing : undefined}
          actions={actions}
        />
      ))}
      <button type="button" className={styles.addSet} onClick={() => actions.addSet(entry.entry.id)}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        <span>Add set</span>
      </button>
    </section>
  );
}
