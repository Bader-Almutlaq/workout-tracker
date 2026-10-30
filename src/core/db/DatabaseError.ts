/** What went wrong in the database layer. */
export type DatabaseErrorKind =
  /** A statement failed (constraint, syntax, missing table…). */
  | 'query'
  /** Bytes given as a database file are not SQLite. */
  | 'notADatabase'
  /** The file was written by a newer version of the app, so this version can't safely open it. */
  | 'newerSchema'
  /** The on-device database could not be opened. */
  | 'open';

/** An error from the database layer, with a message the owner can read. */
export class DatabaseError extends Error {
  override readonly name = 'DatabaseError';

  constructor(
    readonly kind: DatabaseErrorKind,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(cause instanceof Error ? `${message} (${cause.message})` : message);
  }
}
