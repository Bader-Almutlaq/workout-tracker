import { WorkoutTextField } from './WorkoutTextField';
import { database, useDatabaseQuery } from '../../data/database';
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
  notes,
}: {
  readonly entry: LiveWorkoutEntry;
  readonly index: number;
  readonly count: number;
  /** The cell being edited, if it is in this exercise. */
  readonly editing: EditedCell | undefined;
  readonly actions: ExerciseCardActions;
  /** History supplies note writers; live logging keeps its existing card. */
  readonly notes?: {
    readonly exercise: (notes: string) => void;
    readonly set: (setId: number, notes: string) => void;
  };
}) {
  const suggestions = useDatabaseQuery(`warmup-suggestions-${entry.entry.id}`, () =>
    database.suggestedWarmupSetIds(entry.entry.id),
  );
  const suggestedIds = suggestions.status === 'ready' ? suggestions.value : [];
  const unit =
    notes === undefined
      ? entry.exercise.defaultEntryUnit
      : (entry.sets[0]?.entryUnit ?? entry.exercise.defaultEntryUnit);
  const labels = setLabels(entry.sets);
  const previousSets = matchPreviousSets(entry.sets, entry.previous);
  return (
    <section className={styles.card} aria-label={entry.exercise.name}>
      <ExerciseCardHeader entry={entry} index={index} count={count} actions={actions} unit={unit} />
      {suggestions.status === 'failed' && (
        <p className={styles.error} role="alert">
          {suggestions.message}
        </p>
      )}
      {notes !== undefined && (
        <WorkoutTextField isMultiline label="Exercise notes" value={entry.entry.notes ?? ''} onSave={notes.exercise} />
      )}
      <SetColumnHeader tracking={entry.exercise.tracking} unit={unit} />
      {entry.sets.map((set, position) => (
        <SetRow
          key={set.id}
          entry={entry}
          set={set}
          label={labels[position] ?? ''}
          isSuggested={suggestedIds.includes(set.id)}
          displayUnit={unit}
          separatesWarmups={set.kind !== 'warmup' && entry.sets[position - 1]?.kind === 'warmup'}
          previous={previousSets[position]}
          editing={editing?.set.id === set.id ? editing : undefined}
          actions={actions}
          {...(notes === undefined
            ? {}
            : { onNotesChange: (value: string) => notes.set(set.id, value), isPastWorkout: true })}
        />
      ))}
      <button type="button" className={styles.addSet} onClick={() => actions.addSet(entry.entry.id)}>
        <Plus size={16} strokeWidth={2} aria-hidden />
        <span>Add set</span>
      </button>
    </section>
  );
}
