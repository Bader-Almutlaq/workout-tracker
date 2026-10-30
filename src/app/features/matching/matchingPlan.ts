import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import type { ExerciseCatalogUnmatchedImport } from '../../../core/queries/ExerciseCatalog';

/** An imported exercise with the library exercises that look most like it. */
export interface UnmatchedWithSuggestions {
  readonly unmatched: ExerciseCatalogUnmatchedImport;
  /** Best first, at most three. May be empty. */
  readonly suggestions: readonly ExerciseSearchEntry[];
}

/** A proposed merge: `source` (the imported exercise) moves into `target` (a library exercise). */
export interface ProposedMerge {
  readonly source: ExerciseCatalogUnmatchedImport;
  readonly target: ExerciseSearchEntry;
}

/** How many suggestions each imported exercise shows. */
export const SUGGESTION_LIMIT = 3;

/** Pairs each imported exercise with its closest library exercises; `suggest` is `ExerciseSearch.suggestions`. */
export function withSuggestions(
  unmatched: readonly ExerciseCatalogUnmatchedImport[],
  suggest: (name: string, limit: number) => ExerciseSearchEntry[],
): UnmatchedWithSuggestions[] {
  return unmatched.map((item) => ({ unmatched: item, suggestions: suggest(item.exercise.name, SUGGESTION_LIMIT) }));
}

/** The merge that "Match all suggested" would make for each imported exercise that has a suggestion: its top one. */
export function topSuggestionMerges(items: readonly UnmatchedWithSuggestions[]): ProposedMerge[] {
  return items.flatMap(({ unmatched, suggestions }) => {
    const target = suggestions[0];
    return target === undefined ? [] : [{ source: unmatched, target }];
  });
}

/** The question asked before a merge, naming both exercises and how much history moves. */
export function mergeQuestion(merge: ProposedMerge): string {
  const count = merge.source.workoutCount;
  const history = count === 1 ? '1 session' : `${count.toLocaleString('en-US')} sessions`;
  return `Move ${history} of “${merge.source.exercise.name}” into “${merge.target.name}”?`;
}
