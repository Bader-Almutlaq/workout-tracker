import { describe, expect, it } from 'vitest';
import { backupCaption, isBackupStale } from './BackupReminder';

describe('isBackupStale', () => {
  const now = new Date('2026-10-30T12:00:00Z');

  it('reminds when there is no readable backup', () => {
    expect(isBackupStale(undefined, now)).toBe(true);
    expect(isBackupStale('invalid', now)).toBe(true);
  });

  it('does not remind at six or seven days', () => {
    expect(isBackupStale('2026-10-24T12:00:00Z', now)).toBe(false);
    expect(isBackupStale('2026-10-23T12:00:00Z', now)).toBe(false);
    // Whole days, like the "Last backup 7 days ago" label: still 7 days, so no reminder yet.
    expect(isBackupStale('2026-10-23T11:59:59Z', now)).toBe(false);
  });

  it('reminds at eight days', () => {
    expect(isBackupStale('2026-10-22T12:00:00Z', now)).toBe(true);
  });

  it('treats a future backup as current', () => {
    expect(isBackupStale('2026-10-31T12:00:00Z', now)).toBe(false);
  });
});

describe('backupCaption', () => {
  const now = new Date('2026-10-30T12:00:00Z');

  it('describes missing, recent and stale backups', () => {
    expect(backupCaption(undefined, now, false)).toBe('Not backed up yet');
    expect(backupCaption('2026-10-27T12:00:00Z', now, false)).toBe('Last backup: 3 days ago');
    expect(backupCaption('2026-10-29T12:00:00Z', now, false)).toBe('Last backup: 1 day ago');
    expect(backupCaption('2026-10-22T12:00:00Z', now, false)).toBe('Last backup: 8 days ago');
  });

  it('shows a successful backup immediately', () => {
    expect(backupCaption(undefined, now, true)).toBe('Backed up just now');
    expect(backupCaption('2026-10-30T12:00:00Z', now, false)).toBe('Last backup: today');
  });
});
