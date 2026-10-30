import { expect, test } from 'vitest';
import type { DropboxBackupState } from './DropboxBackup';
import { dropboxCaption } from './dropboxCaption';

const NOW = new Date('2026-10-31T12:00:00Z');
const CONNECTED: DropboxBackupState = {
  enabled: true,
  phase: 'idle',
  connected: true,
  awaitingCode: false,
  reconnect: false,
  lastBackupAt: '2026-10-31T11:58:00Z',
  message: undefined,
};

test('connection caption describes minutes, hours, days, missing and unreadable timestamps', () => {
  expect(dropboxCaption(CONNECTED, NOW)).toBe('Connected · last backup 2 min ago');
  expect(dropboxCaption({ ...CONNECTED, lastBackupAt: '2026-10-31T11:00:00Z' }, NOW)).toBe(
    'Connected · last backup 1 hr ago',
  );
  expect(dropboxCaption({ ...CONNECTED, lastBackupAt: '2026-10-30T12:00:00Z' }, NOW)).toBe(
    'Connected · last backup 1 day ago',
  );
  expect(dropboxCaption({ ...CONNECTED, lastBackupAt: '2026-10-29T12:00:00Z' }, NOW)).toBe(
    'Connected · last backup 2 days ago',
  );
  expect(dropboxCaption({ ...CONNECTED, lastBackupAt: undefined }, NOW)).toBe('Connected · no backup yet');
  expect(dropboxCaption({ ...CONNECTED, lastBackupAt: 'invalid' }, NOW)).toBe('Connected · no backup yet');
});

test('finish caption gives progress, success, and readable failure priority over a previous backup', () => {
  const recent = { ...CONNECTED, lastBackupAt: NOW.toISOString() };
  expect(dropboxCaption({ ...recent, phase: 'backingUp' }, NOW, true)).toBe('Backing up to Dropbox…');
  expect(dropboxCaption(recent, NOW, true)).toBe('Backed up to Dropbox just now');
  expect(dropboxCaption({ ...recent, message: 'Check your connection.' }, NOW, true)).toBe(
    "Dropbox backup didn't finish: Check your connection.",
  );
  expect(dropboxCaption({ ...recent, lastBackupAt: '2026-11-01T12:00:00Z' }, NOW, true)).toBe(
    'Backed up to Dropbox just now',
  );
});

test('describes loading, authorization, disconnect and reconnect states', () => {
  expect(dropboxCaption({ ...CONNECTED, phase: 'loading' }, NOW)).toBe('Checking Dropbox…');
  expect(dropboxCaption({ ...CONNECTED, phase: 'authorizing' }, NOW)).toBe('Connecting Dropbox…');
  expect(dropboxCaption({ ...CONNECTED, phase: 'disconnecting' }, NOW)).toBe('Disconnecting Dropbox…');
  expect(dropboxCaption({ ...CONNECTED, connected: false, reconnect: true }, NOW)).toBe('Reconnect Dropbox');
  expect(dropboxCaption({ ...CONNECTED, connected: false }, NOW)).toContain('Connect Dropbox for automatic backups');
});
