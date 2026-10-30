import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { Section } from '../../design/components/Section';
import { ExerciseRow } from './ExerciseRow';
import { groupByInitial, recentExercises } from './exerciseSections';
import { NoMatch } from './NoMatch';

/**
 * The list under the filters. Without a search it shows Recent then everything A–Z; with one it
 * shows the ranked results as a single list, or `NoMatch` when there are none.
 */
export function ExerciseListing({
  entries,
  results,
  isSearching,
  query,
}: {
  readonly entries: readonly ExerciseSearchEntry[];
  readonly results: readonly ExerciseSearchEntry[];
  readonly isSearching: boolean;
  readonly query: string;
}) {
  if (isSearching) {
    if (results.length === 0) return <NoMatch query={query} />;
    return (
      <Section label={results.length === 1 ? '1 result' : `${results.length} results`}>
        {results.map((entry) => (
          <ExerciseRow key={entry.id} entry={entry} />
        ))}
      </Section>
    );
  }

  const recent = recentExercises(entries);
  return (
    <>
      {recent.length > 0 && (
        <Section label="Recent">
          {recent.map((entry) => (
            <ExerciseRow key={entry.id} entry={entry} />
          ))}
        </Section>
      )}
      {groupByInitial(entries).map((group) => (
        <Section key={group.heading} label={group.heading}>
          {group.entries.map((entry) => (
            <ExerciseRow key={entry.id} entry={entry} />
          ))}
        </Section>
      ))}
    </>
  );
}
