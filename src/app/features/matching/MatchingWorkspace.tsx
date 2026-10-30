import { useMemo, useState } from 'react';
import { ExerciseSearch, type ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import type { ExerciseCatalogUnmatchedImport } from '../../../core/queries/ExerciseCatalog';
import { log } from '../../../core/support/log';
import { database, messageOf } from '../../data/database';
import { Button } from '../../design/components/Button';
import { ConfirmDialog } from '../../design/components/ConfirmDialog';
import { EmptyState } from '../../design/components/EmptyState';
import { LibraryExercisePicker } from './LibraryExercisePicker';
import { MatchAllList } from './MatchAllList';
import { mergeQuestion, topSuggestionMerges, withSuggestions, type ProposedMerge } from './matchingPlan';
import styles from './MatchingWorkspace.module.css';
import { UnmatchedCard } from './UnmatchedCard';

const INTRO =
  'These names from Strong aren’t in the library yet. Match each to a library exercise to count its sets per muscle. History moves with it; nothing is deleted.';

/** What the owner is being asked to confirm. */
type Question = { readonly kind: 'one'; readonly merge: ProposedMerge } | { readonly kind: 'all' };

/** The list of imported exercises with their suggestions, and the confirmations before anything moves. */
export function MatchingWorkspace({
  unmatched,
  entries,
}: {
  readonly unmatched: readonly ExerciseCatalogUnmatchedImport[];
  readonly entries: readonly ExerciseSearchEntry[];
}) {
  const [question, setQuestion] = useState<Question>();
  const [picking, setPicking] = useState<ExerciseCatalogUnmatchedImport>();
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string>();
  const library = useMemo(() => entries.filter((entry) => !entry.isCustom), [entries]);
  const search = useMemo(() => new ExerciseSearch(library), [library]);
  const items = useMemo(
    () => withSuggestions(unmatched, (name, limit) => search.suggestions(name, limit)),
    [unmatched, search],
  );
  const allMerges = useMemo(() => topSuggestionMerges(items), [items]);

  const merge = async (merges: readonly ProposedMerge[]) => {
    setIsMerging(true);
    setError(undefined);
    try {
      await database.mergeExercises(merges.map(({ source, target }) => [source.exercise.id, target.id] as const));
    } catch (failure) {
      log.ui.error('Merging exercises failed', failure);
      setError(messageOf(failure));
    } finally {
      setIsMerging(false);
      setQuestion(undefined);
    }
  };

  if (picking !== undefined) {
    return (
      <LibraryExercisePicker
        title={picking.exercise.name}
        search={search}
        onPick={(target) => {
          setPicking(undefined);
          setQuestion({ kind: 'one', merge: { source: picking, target } });
        }}
        onCancel={() => setPicking(undefined)}
      />
    );
  }
  if (items.length === 0 && error === undefined) {
    return (
      <EmptyState message="All matched. Every imported exercise is linked to the library or tagged as your own." />
    );
  }

  return (
    <>
      <p className={styles.intro}>{INTRO}</p>
      {error !== undefined && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {allMerges.length > 0 && (
        <Button variant="primary" onPress={() => setQuestion({ kind: 'all' })}>
          Match all suggested
        </Button>
      )}
      {items.map((item) => (
        <UnmatchedCard
          key={item.unmatched.exercise.id}
          item={item}
          onMatch={(target) => setQuestion({ kind: 'one', merge: { source: item.unmatched, target } })}
          onSearch={() => setPicking(item.unmatched)}
        />
      ))}
      {question?.kind === 'one' && (
        <ConfirmDialog
          title={mergeQuestion(question.merge)}
          confirmLabel="Move history"
          isBusy={isMerging}
          onConfirm={() => void merge([question.merge])}
          onCancel={() => setQuestion(undefined)}
        />
      )}
      {question?.kind === 'all' && (
        <ConfirmDialog
          title={`Match ${allMerges.length} exercises?`}
          confirmLabel="Match all"
          isBusy={isMerging}
          onConfirm={() => void merge(allMerges)}
          onCancel={() => setQuestion(undefined)}
        >
          <MatchAllList merges={allMerges} />
        </ConfirmDialog>
      )}
    </>
  );
}
