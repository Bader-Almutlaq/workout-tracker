/** Parts of a backup file name. */
export const BackupFileNaming = {
  /** Every backup name starts with this, so the owner can tell them apart in Files. */
  prefix: 'WorkoutTracker-',
  /** A backup is a plain SQLite file. */
  extension: '.sqlite',
  /** Length of `YYYY-MM-DDTHH:mm:ss`, the part of an ISO 8601 string kept in the name (whole seconds, no `.sss` or `Z`). */
  stampLength: 19,
} as const;

/**
 * The file name for a backup made at `createdAt`: `WorkoutTracker-2026-10-30T13-05-00.sqlite`.
 * The time is UTC with `:` replaced by `-` (iOS Files dislikes colons), so names sort in time order.
 * Fractions of a second are dropped.
 */
export function backupFileName(createdAt: Date): string {
  const stamp = createdAt.toISOString().slice(0, BackupFileNaming.stampLength).replaceAll(':', '-');
  return `${BackupFileNaming.prefix}${stamp}${BackupFileNaming.extension}`;
}

const NAME_PATTERN = /^WorkoutTracker-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})\.sqlite$/;

/**
 * The moment encoded in a backup file name, or `undefined` when `fileName` is not one of ours
 * (including impossible dates such as month 13). Inverse of `backupFileName`.
 */
export function parseBackupFileName(fileName: string): Date | undefined {
  const match = NAME_PATTERN.exec(fileName);
  if (match === null) return undefined;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    return undefined;
  }
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  // Date.UTC rolls 31 February over to March; rebuilding the name catches that.
  return backupFileName(date) === fileName ? date : undefined;
}
