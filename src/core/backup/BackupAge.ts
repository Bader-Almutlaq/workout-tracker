/** Milliseconds in one day. */
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days (24-hour periods) between the last backup and `now`, for "Last backup: 3 days ago".
 * Returns `undefined` when there has never been a backup or the stored time is unreadable.
 * A time slightly in the future (clock changes) counts as 0.
 */
export function daysSinceBackup(lastBackupAt: string | undefined, now: Date): number | undefined {
  if (lastBackupAt === undefined) return undefined;
  const then = Date.parse(lastBackupAt);
  if (Number.isNaN(then)) return undefined;
  return Math.max(0, Math.floor((now.getTime() - then) / MILLISECONDS_PER_DAY));
}
