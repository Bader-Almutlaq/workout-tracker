/** Why a backup could not be made, checked or restored. */
export type BackupErrorKind =
  /** The file is not a Workout Tracker backup (not SQLite, or SQLite without this app's data). */
  | 'notABackup'
  /** SQLite's own integrity check failed, or the schema cannot be brought up to date. */
  | 'damaged'
  /** The backup was made by a newer version of the app than the one running. */
  | 'newerVersion'
  /** The backup lacks tables this version of the app needs. */
  | 'missingTables'
  /** The safety snapshot could not be saved, so nothing was changed. */
  | 'snapshotFailed'
  /** Replacing the data failed after the safety snapshot was taken. */
  | 'restoreFailed';

/** An error from the backup layer, with a message the owner can read. */
export class BackupError extends Error {
  override readonly name = 'BackupError';

  constructor(
    readonly kind: BackupErrorKind,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
}
