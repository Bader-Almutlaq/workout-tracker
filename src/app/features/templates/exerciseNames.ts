import type { ExerciseSearchEntry } from '../../../core/library/ExerciseSearch';

/** What a template shows for an exercise that has since been archived (the library lists only active ones). */
export const ARCHIVED_EXERCISE_NAME = 'Archived exercise';

/** The names of the exercises in the library, by id. */
export function exerciseNamesById(entries: readonly ExerciseSearchEntry[]): ReadonlyMap<number, string> {
  return new Map(entries.map((entry) => [entry.id, entry.name]));
}

/** The name of the exercise, or a stand-in when it is no longer in the library. */
export function exerciseNameOf(names: ReadonlyMap<number, string>, exerciseId: number): string {
  return names.get(exerciseId) ?? ARCHIVED_EXERCISE_NAME;
}
