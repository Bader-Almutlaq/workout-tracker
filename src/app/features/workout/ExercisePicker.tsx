import { useMemo, useState } from 'react';
import { ExerciseSearch, type ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { SearchField } from '../../design/components/SearchField';
import {
  EMPTY_BROWSE_STATE,
  isSearching,
  searchFilterOf,
  type ExerciseBrowseState,
} from '../exercises/exerciseBrowseState';
import { ExerciseFilters } from '../exercises/ExerciseFilters';
import { searchPlaceholder } from '../exercises/exerciseText';
import { AddExerciseBar } from './AddExerciseBar';
import styles from './ExercisePicker.module.css';
import { PickerListing } from './PickerListing';

/**
 * Search and filters like the Exercises tab, but a tap picks an exercise instead of opening it.
 * "Add (n)" hands the picked exercises to `onAdd` in the order they were picked; what adding means
 * (the workout in progress, a template) is up to the screen that shows the picker.
 * The search is its own: it doesn't share the Exercises tab's remembered state.
 */
export function ExercisePicker({
  entries,
  onAdd,
}: {
  readonly entries: readonly ExerciseSearchEntry[];
  readonly onAdd: (exerciseIds: readonly number[]) => void;
}) {
  const [state, setState] = useState<ExerciseBrowseState>(EMPTY_BROWSE_STATE);
  const [picked, setPicked] = useState<readonly number[]>([]);
  const search = useMemo(() => new ExerciseSearch(entries), [entries]);
  const results = useMemo(() => search.results(state.query, searchFilterOf(state), new Date()), [search, state]);

  const toggle = (exerciseId: number) =>
    setPicked((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId],
    );

  return (
    <>
      <div className={styles.toolbar}>
        <SearchField
          value={state.query}
          placeholder={searchPlaceholder(entries.length)}
          onChange={(query) => setState({ ...state, query })}
        />
        <ExerciseFilters state={state} onChange={setState} />
      </div>
      <PickerListing
        entries={entries}
        results={results}
        isSearching={isSearching(state)}
        query={state.query.trim()}
        picked={picked}
        onToggle={toggle}
      />
      <AddExerciseBar count={picked.length} onAdd={() => onAdd(picked)} />
    </>
  );
}
