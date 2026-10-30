import { daysSinceBackup } from './BackupAge';

/** Heuristic: a weekly reminder makes backup age visible without interrupting workouts. */
export const BackupReminderPolicy = { staleAfterDays: 7 } as const;

/**
 * Whether the owner should see the backup reminder: no backup yet (or an unreadable date), or the
 * last one is more than `staleAfterDays` old. Uses `daysSinceBackup`, the one definition of a backup's age.
 */
export function isBackupStale(lastBackupAt: string | undefined, now: Date): boolean {
  const days = daysSinceBackup(lastBackupAt, now);
  return days === undefined || days > BackupReminderPolicy.staleAfterDays;
}
