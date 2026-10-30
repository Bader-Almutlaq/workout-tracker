import { useDeferredValue, useMemo, useState } from 'react';
import type { ExerciseSearch, ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { Button } from '../../design/components/Button';
import { SearchField } from '../../design/components/SearchField';
import { Section } from '../../design/components/Section';
import { exerciseSubtitle } from '../exercises/exerciseText';
import styles from './LibraryExercisePicker.module.css';

/** The most results drawn at once: an empty search would otherwise list the whole library. */
const RESULT_LIMIT = 40;

/** Searches the built-in exercises to pick the one that `title` (an imported name) should become. */
export function LibraryExercisePicker({
  title,
  search,
  onPick,
  onCancel,
}: {
  readonly title: string;
  readonly search: ExerciseSearch;
  readonly onPick: (entry: ExerciseSearchEntry) => void;
  readonly onCancel: () => void;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => search.results(deferredQuery, {}, new Date()).slice(0, RESULT_LIMIT),
    [search, deferredQuery],
  );

  return (
    <>
      <p className={styles.prompt}>Find the library exercise for “{title}”.</p>
      <SearchField value={query} placeholder="Search the library" onChange={setQuery} />
      <Section label={results.length === 0 ? 'No match' : 'Library'}>
        {results.map((entry) => (
          <button key={entry.id} type="button" className={styles.row} onClick={() => onPick(entry)}>
            <span className={styles.name}>{entry.name}</span>
            <span className={styles.meta}>{exerciseSubtitle({ ...entry, usageCount: 0 })}</span>
          </button>
        ))}
      </Section>
      <Button onPress={onCancel}>Back to the list</Button>
    </>
  );
}
