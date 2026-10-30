import { expect, test, vi } from 'vitest';
import { DropboxTokenStore } from './DropboxTokenStore';

test('uses one key, keeps other storage untouched, and stores only the refresh token', () => {
  const storage = {
    getItem: vi.fn(() => 'refresh'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  const tokens = new DropboxTokenStore(() => storage);
  expect(tokens.read()).toBe('refresh');
  tokens.write('new refresh');
  tokens.clear();
  expect(storage.getItem).toHaveBeenCalledWith('workout-tracker.dropbox.refresh-token');
  expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('workout-tracker.dropbox.refresh-token', 'new refresh');
  expect(storage.removeItem).toHaveBeenCalledExactlyOnceWith('workout-tracker.dropbox.refresh-token');
  expect(storage.clear).not.toHaveBeenCalled();
});

test('guards localStorage getter and all operations without leaking the original error', () => {
  const tokens = new DropboxTokenStore(() => {
    throw new Error('sensitive raw error');
  });
  expect(() => tokens.read()).toThrow('could not be read');
  expect(() => tokens.write('secret')).toThrow('could not stay connected');
  expect(() => tokens.clear()).toThrow('could not be removed');
});
