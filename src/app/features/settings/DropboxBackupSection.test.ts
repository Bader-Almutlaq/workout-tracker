import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import type { DropboxBackupState } from '../../data/dropbox/DropboxBackup';
import { DropboxBackupLine } from '../workout/DropboxBackupLine';
import { DropboxBackupSection } from './DropboxBackupSection';

const view = vi.hoisted(() => ({
  state: {
    enabled: true,
    phase: 'idle',
    connected: false,
    awaitingCode: false,
    reconnect: false,
    lastBackupAt: undefined,
    message: undefined,
  } as DropboxBackupState, // This fixture is checked against every field of the public view-state type.
}));
vi.mock('../../data/dropbox/useDropboxBackup', () => ({ useDropboxBackup: () => view.state }));
vi.mock('../../data/dropbox/cloudBackup', () => ({ dropboxBackup: {} }));

afterEach(() => {
  view.state = {
    enabled: true,
    phase: 'idle',
    connected: false,
    awaitingCode: false,
    reconnect: false,
    lastBackupAt: undefined,
    message: undefined,
  };
});

function settingsMarkup(): string {
  return renderToStaticMarkup(createElement(DropboxBackupSection));
}

function finishMarkup(): string {
  return renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(DropboxBackupLine)));
}

test('the entire optional Settings section and finish row disappear when the feature is disabled', () => {
  view.state = { ...view.state, enabled: false, connected: true, message: 'old error' };
  expect(settingsMarkup()).toBe('');
  expect(finishMarkup()).toBe('');
});

test('disconnected Settings offers Connect and displays the copy-code instructions and field after authorization', () => {
  expect(settingsMarkup()).toContain('Connect Dropbox');
  expect(settingsMarkup()).not.toContain('>Disconnect</button>');
  expect(finishMarkup()).toBe('');
  view.state = { ...view.state, awaitingCode: true };
  const markup = settingsMarkup();
  expect(markup).toContain('Approve in Dropbox, copy the code it shows, and paste it here');
  expect(markup).toContain('id="dropbox-code"');
  expect(markup).toContain('Finish connecting');
});

test('connected Settings exposes manual cloud backup and Disconnect, disabling them during upload', () => {
  view.state = { ...view.state, connected: true, phase: 'backingUp' };
  const markup = settingsMarkup();
  expect(markup).toContain('Back up to Dropbox now');
  expect(markup).toContain('Disconnect');
  expect(markup).toContain('Backing up to Dropbox…');
  expect(markup.match(/disabled=""/g)).toHaveLength(2);
});

test('finish failure has an alert and Try again; revoked connections instead link to Settings', () => {
  view.state = { ...view.state, connected: true, message: 'Check your connection.' };
  expect(finishMarkup()).toContain('role="alert"');
  expect(finishMarkup()).toContain('Try again');
  view.state = { ...view.state, connected: false, reconnect: true };
  expect(settingsMarkup()).toContain('Reconnect Dropbox');
  expect(finishMarkup()).toContain('href="/settings"');
  expect(finishMarkup()).not.toContain('Try again');
});
