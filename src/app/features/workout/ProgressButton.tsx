import { valueIn } from '../../../core/units/Weight';
import type { LiveWorkoutEntry } from '../../../core/queries/LiveWorkout';
import { weightNumberText } from '../../format/weightText';
import type { ExerciseCardActions } from './ExerciseCardActions';
import styles from './ExerciseCard.module.css';

/** Applies the available progression values to unfinished sets only, without completing them. */
export function ProgressButton({
  entry,
  actions,
}: {
  readonly entry: LiveWorkoutEntry;
  readonly actions: ExerciseCardActions;
}) {
  const suggestions = entry.progression?.suggestions ?? [];
  const first = suggestions.find((item) => entry.sets.some((set) => set.id === item.setId && !set.isCompleted));
  const firstSet = entry.sets.find((set) => set.id === first?.setId);
  if (first === undefined || firstSet === undefined || actions.applySuggestion === undefined) return null;
  return (
    <button
      type="button"
      className={styles.progressButton}
      onClick={() => {
        for (const suggestion of suggestions) {
          const set = entry.sets.find((item) => item.id === suggestion.setId);
          if (set === undefined || set.isCompleted) continue;
          if (suggestion.weightKilograms !== null)
            actions.applySuggestion?.(set.id, 'weight', valueIn(suggestion.weightKilograms, set.entryUnit));
          actions.applySuggestion?.(set.id, 'reps', suggestion.reps);
        }
      }}
    >
      Progress ·{' '}
      {first.weightKilograms === null
        ? ''
        : `${weightNumberText(first.weightKilograms, firstSet.entryUnit)} ${firstSet.entryUnit} × `}
      {first.reps}
    </button>
  );
}
