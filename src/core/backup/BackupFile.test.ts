import { describe, expect, test } from 'vitest';
import { daysSinceBackup } from './BackupAge';
import { backupFileName, parseBackupFileName } from './BackupFile';

describe('backup file names', () => {
  const moment = new Date('2026-10-30T13:05:09.876Z');

  test('names are UTC, sortable and free of colons', () => {
    expect(backupFileName(moment)).toBe('WorkoutTracker-2026-10-30T13-05-09.sqlite');
  });

  test('a name parses back to the same moment, truncated to whole seconds', () => {
    const parsed = parseBackupFileName(backupFileName(moment));
    expect(parsed?.toISOString()).toBe('2026-10-30T13:05:09.000Z');
  });

  test('names sort in time order', () => {
    const earlier = backupFileName(new Date('2026-01-02T03:04:05Z'));
    const later = backupFileName(new Date('2026-10-30T13:05:09Z'));
    expect([later, earlier].sort()).toEqual([earlier, later]);
  });

  test('anything that is not one of our names is rejected', () => {
    for (const name of [
      '',
      'workouts.sqlite',
      'WorkoutTracker-2026-10-30T13-05-09.sqlite.icloud',
      'WorkoutTracker-2026-10-30T13-05-09 2.sqlite',
      'WorkoutTracker-2026-10-30T13:05:09.sqlite',
      'WorkoutTracker-2026-13-30T13-05-09.sqlite',
      'WorkoutTracker-2026-02-31T13-05-09.sqlite',
      'WorkoutTracker-2026-10-30T25-05-09.sqlite',
    ]) {
      expect(parseBackupFileName(name), name).toBeUndefined();
    }
  });
});

describe('days since the last backup', () => {
  const now = new Date('2026-10-30T12:00:00Z');

  test('never backed up', () => {
    expect(daysSinceBackup(undefined, now)).toBeUndefined();
  });

  test('an unreadable stored value counts as never', () => {
    expect(daysSinceBackup('yesterday-ish', now)).toBeUndefined();
  });

  test('counts whole 24-hour periods', () => {
    expect(daysSinceBackup('2026-10-30T11:00:00Z', now)).toBe(0);
    expect(daysSinceBackup('2026-10-29T12:00:00Z', now)).toBe(1);
    expect(daysSinceBackup('2026-10-27T11:59:59Z', now)).toBe(3);
  });

  test('a time in the future counts as today', () => {
    expect(daysSinceBackup('2026-10-30T12:05:00Z', now)).toBe(0);
  });
});
