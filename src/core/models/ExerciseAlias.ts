/**
 * Another name that resolves to an exercise, such as a Strong name merged into a library exercise
 * ("Bayesian Cable Curl" → "Bayesian Curl (Cable)"). Table `exerciseAlias`.
 *
 * Built-in slang for library exercises lives in `library.json`, not here; this table holds only
 * names that come from the owner's own data.
 */
export interface ExerciseAlias {
  /** The alternative name. Unique, case-insensitive. */
  readonly alias: string;
  readonly exerciseId: number;
}

/** A raw `exerciseAlias` row as SQLite returns it. */
export type ExerciseAliasRow = ExerciseAlias;

/** Converts a raw `exerciseAlias` row to an `ExerciseAlias`. */
export function fromExerciseAliasRow(row: ExerciseAliasRow): ExerciseAlias {
  return { alias: row.alias, exerciseId: row.exerciseId };
}
