import { Plus } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ExerciseSearch, type ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { SearchField } from '../../design/components/SearchField';
import styles from './ExerciseBrowser.module.css';
import {
  isSearching,
  rememberBrowseState,
  rememberedBrowseState,
  searchFilterOf,
  type ExerciseBrowseState,
} from './exerciseBrowseState';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseListing } from './ExerciseListing';
import { searchPlaceholder } from './exerciseText';

/**
 * The search box, filter chips and list. The typed text and chosen filters are remembered, so
 * coming back from an exercise shows the same list.
 */
export function ExerciseBrowser({ entries }: { readonly entries: readonly ExerciseSearchEntry[] }) {
  const [state, setState] = useState<ExerciseBrowseState>(rememberedBrowseState);
  const search = useMemo(() => new ExerciseSearch(entries), [entries]);
  const deferredState = useDeferredValue(state);
  const results = useMemo(
    () => search.results(deferredState.query, searchFilterOf(deferredState), new Date()),
    [search, deferredState],
  );

  useEffect(() => rememberBrowseState(state), [state]);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <SearchField
            value={state.query}
            placeholder={searchPlaceholder(entries.length)}
            onChange={(query) => setState({ ...state, query })}
          />
          <Link to="/exercises/new" className={styles.add} aria-label="New exercise">
            <Plus size={20} strokeWidth={2} aria-hidden />
          </Link>
        </div>
        <ExerciseFilters state={state} onChange={setState} />
      </div>
      <ExerciseListing
        entries={entries}
        results={results}
        isSearching={isSearching(deferredState)}
        query={deferredState.query.trim()}
      />
    </>
  );
}
