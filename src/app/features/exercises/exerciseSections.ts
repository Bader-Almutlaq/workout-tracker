import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';
import { groupBy } from '../../../core/support/groupBy';

/** How many exercises the "Recent" section shows. */
export const RECENT_EXERCISE_LIMIT = 8;

/** Heading for names that don't start with a letter. */
const NON_LETTER_HEADING = '#';

const NAME_COLLATOR = new Intl.Collator('en', { sensitivity: 'accent' });

/** The exercises logged most recently, newest first, at most `limit`. Never-used exercises are left out. */
export function recentExercises(
  entries: readonly ExerciseSearchEntry[],
  limit = RECENT_EXERCISE_LIMIT,
): ExerciseSearchEntry[] {
  return entries
    .filter((entry): entry is ExerciseSearchEntry & { lastUsedAt: Date } => entry.lastUsedAt !== null)
    .sort((left, right) => right.lastUsedAt.getTime() - left.lastUsedAt.getTime())
    .slice(0, limit);
}

/** One alphabetical section of the full list. */
export interface ExerciseInitialGroup {
  /** The upper-case first letter, or "#" for names starting with a digit or symbol. */
  readonly heading: string;
  readonly entries: readonly ExerciseSearchEntry[];
}

/** Every exercise sorted by name and grouped under its first letter; "#" comes last. */
export function groupByInitial(entries: readonly ExerciseSearchEntry[]): ExerciseInitialGroup[] {
  const sorted = [...entries].sort((left, right) => NAME_COLLATOR.compare(left.name, right.name));
  const groups = groupBy(sorted, (entry) => {
    const first = entry.name.charAt(0).toLocaleUpperCase('en');
    return /^\p{L}$/u.test(first) ? first : NON_LETTER_HEADING;
  });
  return [...groups]
    .map(([heading, grouped]) => ({ heading, entries: grouped }))
    .sort((left, right) => {
      if (left.heading === NON_LETTER_HEADING) return 1;
      if (right.heading === NON_LETTER_HEADING) return -1;
      return NAME_COLLATOR.compare(left.heading, right.heading);
    });
}
