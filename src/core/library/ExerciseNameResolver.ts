import type { Database } from '../db/Database';

/**
 * Finds the exercise a name refers to: its own name first, then a stored alias. Both comparisons
 * ignore case (SQLite `NOCASE`, which folds ASCII letters only, as the schema's unique indexes
 * do). Used by the Strong importer so a name the owner has already matched always lands on the
 * same exercise.
 *
 * @returns The id of the exercise called `name` or aliased as `name`, or `undefined`.
 */
export function exerciseIdNamed(db: Database, name: string): number | undefined {
  const byName = db.value<number>('SELECT id FROM exercise WHERE name = ? COLLATE NOCASE', [name]);
  if (byName !== undefined) return byName;
  return db.value<number>('SELECT exerciseId FROM exerciseAlias WHERE alias = ? COLLATE NOCASE', [name]);
}
