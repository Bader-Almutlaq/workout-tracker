import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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
import { addExercises } from './workoutActions';

/**
 * Search and filters like the Exercises tab, but a tap picks an exercise instead of opening it.
 * "Add (n)" appends the picked exercises to the workout in the order they were picked and goes back.
 * The search is its own: it doesn't share the Exercises tab's remembered state.
 */
export function ExercisePicker({
  entries,
  workoutId,
}: {
  readonly entries: readonly ExerciseSearchEntry[];
  readonly workoutId: number;
}) {
  const navigate = useNavigate();
  const [state, setState] = useState<ExerciseBrowseState>(EMPTY_BROWSE_STATE);
  const [picked, setPicked] = useState<readonly number[]>([]);
  const search = useMemo(() => new ExerciseSearch(entries), [entries]);
  const deferredState = useDeferredValue(state);
  const results = useMemo(
    () => search.results(deferredState.query, searchFilterOf(deferredState), new Date()),
    [search, deferredState],
  );

  const toggle = (exerciseId: number) =>
    setPicked((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId],
    );

  const add = () => {
    void addExercises(workoutId, picked);
    navigate('/');
  };

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
        isSearching={isSearching(deferredState)}
        query={deferredState.query.trim()}
        picked={picked}
        onToggle={toggle}
      />
      <AddExerciseBar count={picked.length} onAdd={add} />
    </>
  );
}
