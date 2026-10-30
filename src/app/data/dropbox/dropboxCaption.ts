import type { DropboxBackupState } from './DropboxBackup';

/** Heuristic: whole-minute/hour/day age labels keep the connection caption compact; future times count as just now. */
const CaptionTime = { minute: 60_000, hour: 3_600_000, day: 86_400_000 } as const;

function backupAge(timestamp: string | undefined, now: Date): string {
  const time = timestamp === undefined ? NaN : Date.parse(timestamp);
  if (!Number.isFinite(time)) return 'no backup yet';
  const elapsed = Math.max(0, now.getTime() - time);
  if (elapsed < CaptionTime.minute) return 'last backup just now';
  if (elapsed < CaptionTime.hour) return `last backup ${Math.floor(elapsed / CaptionTime.minute)} min ago`;
  if (elapsed < CaptionTime.day) return `last backup ${Math.floor(elapsed / CaptionTime.hour)} hr ago`;
  const days = Math.floor(elapsed / CaptionTime.day);
  return `last backup ${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/** Owner-facing Settings/finish captions; a failed request takes precedence over the last successful upload date. */
export function dropboxCaption(state: DropboxBackupState, now: Date, finishSummary = false): string {
  if (state.phase === 'backingUp') return 'Backing up to Dropbox…';
  if (state.phase === 'authorizing') return 'Connecting Dropbox…';
  if (state.phase === 'disconnecting') return 'Disconnecting Dropbox…';
  if (state.phase === 'loading') return 'Checking Dropbox…';
  if (state.message !== undefined) return `Dropbox backup didn't finish: ${state.message}`;
  if (state.reconnect) return 'Reconnect Dropbox';
  if (!state.connected) return 'Connect Dropbox for automatic backups after each workout.';
  const age = backupAge(state.lastBackupAt, now);
  if (finishSummary && age === 'last backup just now') return 'Backed up to Dropbox just now';
  return `Connected · ${age}`;
}
