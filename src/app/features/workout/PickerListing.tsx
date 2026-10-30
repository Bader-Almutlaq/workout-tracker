import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { Section } from '../../design/components/Section';
import { groupByInitial, recentExercises } from '../exercises/exerciseSections';
import { NoMatch } from '../exercises/NoMatch';
import { PickerRow } from './PickerRow';

/**
 * The list under the picker's filters, laid out like the Exercises tab (Recent, then A–Z; or ranked
 * results while searching) with tappable rows that pick several exercises.
 */
export function PickerListing({
  entries,
  results,
  isSearching,
  query,
  picked,
  onToggle,
}: {
  readonly entries: readonly ExerciseSearchEntry[];
  readonly results: readonly ExerciseSearchEntry[];
  readonly isSearching: boolean;
  readonly query: string;
  /** Ids of the picked exercises, in the order they were picked. */
  readonly picked: readonly number[];
  readonly onToggle: (exerciseId: number) => void;
}) {
  const row = (entry: ExerciseSearchEntry) => (
    <PickerRow key={entry.id} entry={entry} isPicked={picked.includes(entry.id)} onToggle={() => onToggle(entry.id)} />
  );

  if (isSearching) {
    if (results.length === 0) return <NoMatch query={query} />;
    return (
      <Section label={results.length === 1 ? '1 result' : `${results.length} results`}>{results.map(row)}</Section>
    );
  }

  const recent = recentExercises(entries);
  return (
    <>
      {recent.length > 0 && <Section label="Recent">{recent.map(row)}</Section>}
      {groupByInitial(entries).map((group) => (
        <Section key={group.heading} label={group.heading}>
          {group.entries.map(row)}
        </Section>
      ))}
    </>
  );
}
