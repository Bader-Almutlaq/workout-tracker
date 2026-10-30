import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { backupFileName } from '../../../core/backup/BackupFile';
import { log } from '../../../core/support/log';
import type { CloudBackupSettings, CloudBackupSettingsUpdate } from '../../../worker/WorkerApi';
import { DropboxApi } from './DropboxApi';
import { DropboxBackup } from './DropboxBackup';
import { DropboxTokenStore } from './DropboxTokenStore';
import { verifierChallenge } from './pkce';

const NOW = '2026-10-31T12:00:00.000Z';
const REFRESH = 'synthetic-refresh-token';
const ACCESS = 'synthetic-access-token';

function setup(appKey = 'synthetic-app-key') {
  let clock = Date.parse(NOW);
  const saved = new Map<string, string>();
  const storage: Storage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => {
      saved.set(key, value);
    },
    removeItem: (key) => {
      saved.delete(key);
    },
    clear: () => saved.clear(),
    key: (index) => [...saved.keys()][index] ?? null,
    get length() {
      return saved.size;
    },
  };
  const tokens = new DropboxTokenStore(() => storage);
  let settings: CloudBackupSettings = { provider: null, pending: false, lastCloudBackupAt: undefined };
  let version = 0;
  const bytes = new Uint8Array([83, 81, 76, 105, 116, 101]);
  const database = {
    exportBackup: vi.fn(async () => ({ fileName: backupFileName(new Date(clock)), bytes, changeVersion: version })),
    cloudBackupSettings: vi.fn(async () => settings),
    updateCloudBackupSettings: vi.fn(async (change: CloudBackupSettingsUpdate) => {
      settings = {
        provider: change.provider === undefined ? settings.provider : change.provider,
        pending:
          change.pending === undefined ||
          (change.pending === false &&
            change.completedExportVersion !== undefined &&
            change.completedExportVersion !== version)
            ? settings.pending
            : change.pending,
        lastCloudBackupAt:
          change.lastCloudBackupAt === undefined ? settings.lastCloudBackupAt : (change.lastCloudBackupAt ?? undefined),
      };
      version += 1;
    }),
  };
  const listed = Array.from({ length: 20 }, (_, index) => {
    const timestamp = `2026-10-${String(index + 1).padStart(2, '0')}T12:00:00Z`;
    const name = backupFileName(new Date(timestamp));
    return { '.tag': 'file', name, path_display: `/${name}`, server_modified: timestamp };
  });
  const request = vi.fn<typeof fetch>(async (url) => {
    if (String(url).endsWith('/oauth2/token'))
      return Response.json({ access_token: ACCESS, refresh_token: REFRESH, expires_in: 3600 });
    if (String(url).endsWith('/list_folder')) return Response.json({ entries: listed, has_more: false, cursor: 'end' });
    return Response.json({});
  });
  const api = new DropboxApi(appKey, tokens, request, () => clock);
  const backup = new DropboxBackup(appKey, database, tokens, api, () => new Date(clock));
  const popup = { navigate: vi.fn(), close: vi.fn() };
  return {
    backup,
    api,
    tokens,
    storage,
    database,
    request,
    bytes,
    popup,
    listed,
    settings: () => settings,
    advance: (milliseconds: number) => {
      clock += milliseconds;
    },
    connect: async () => {
      await backup.beginConnect(() => popup);
      await backup.finishConnecting(' pasted-code ');
    },
  };
}

beforeEach(() => {
  vi.spyOn(log.backup, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Dropbox connection and backup orchestration', () => {
  test('empty configured key disables all storage, database, browser, and network actions', async () => {
    const { backup, request, database, popup } = setup('');
    const open = vi.fn(() => popup);
    await backup.initialize();
    await backup.beginConnect(open);
    await backup.finishConnecting('code');
    await backup.backUp();
    await backup.afterWorkout();
    await backup.retryPending();
    await backup.disconnect();
    expect(backup.snapshot().enabled).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    expect(database.cloudBackupSettings).not.toHaveBeenCalled();
    expect(database.exportBackup).not.toHaveBeenCalled();
  });

  test('connect exchanges a pasted code with the same in-memory verifier, and immediately uploads', async () => {
    const { backup, popup, connect, request, storage, database, bytes, settings } = setup();
    await connect();
    const authorization = new URL(String(popup.navigate.mock.calls[0]?.[0]));
    const tokenCall = request.mock.calls.find(([url]) => String(url).endsWith('/oauth2/token'));
    const parameters = new URLSearchParams(String(tokenCall?.[1]?.body));
    expect(parameters.get('code')).toBe('pasted-code');
    expect(parameters.get('grant_type')).toBe('authorization_code');
    expect(parameters.has('client_secret')).toBe(false);
    expect(parameters.has('redirect_uri')).toBe(false);
    expect(await verifierChallenge(parameters.get('code_verifier') ?? '')).toBe(
      authorization.searchParams.get('code_challenge'),
    );
    expect(storage.length).toBe(1);
    expect(storage.getItem('workout-tracker.dropbox.refresh-token')).toBe(REFRESH);
    expect(JSON.stringify(settings())).not.toContain(REFRESH);
    const uploadCall = request.mock.calls.find(([url]) => String(url).endsWith('/upload'));
    expect(uploadCall?.[1]?.headers).toMatchObject({
      Authorization: `Bearer ${ACCESS}`,
      'Dropbox-API-Arg': JSON.stringify({
        path: '/WorkoutTracker-2026-10-31T12-00-00.sqlite',
        mode: 'add',
        autorename: false,
        mute: true,
      }),
    });
    expect(uploadCall?.[1]?.body).toEqual(bytes.buffer);
    expect(database.exportBackup).toHaveBeenCalledOnce();
    expect(settings()).toEqual({ provider: 'dropbox', pending: false, lastCloudBackupAt: NOW });
    expect(backup.snapshot()).toMatchObject({
      connected: true,
      awaitingCode: false,
      phase: 'idle',
      message: undefined,
    });
  });

  test('opens the tab synchronously before crypto completes and gives blocked popups a readable failure', async () => {
    const { backup, popup } = setup();
    const open = vi.fn(() => popup);
    const connecting = backup.beginConnect(open);
    expect(open).toHaveBeenCalledOnce();
    await connecting;
    expect(backup.snapshot().awaitingCode).toBe(true);
    await backup.beginConnect(() => null);
    expect(backup.snapshot().message).toContain('Allow a new tab');
  });

  test('failed code exchanges require a fresh Connect and never persist rejected credentials', async () => {
    const { backup, request, storage, popup } = setup();
    request.mockResolvedValue(Response.json({ error: 'invalid_grant', error_description: ACCESS }, { status: 400 }));
    await backup.beginConnect(() => popup);
    await backup.finishConnecting('expired');
    expect(backup.snapshot()).toMatchObject({ connected: false, awaitingCode: false });
    expect(backup.snapshot().message).toContain("That code didn't work");
    expect(storage.length).toBe(0);
    expect(JSON.stringify(vi.mocked(log.backup.error).mock.calls)).not.toContain(ACCESS);
    request.mockClear();
    await backup.finishConnecting('reuse');
    expect(request).not.toHaveBeenCalled();
  });

  test('refreshes an expired access token, using only client_id and the stored refresh token', async () => {
    const { connect, backup, request, advance } = setup();
    await connect();
    request.mockClear();
    advance(3_600_000);
    await backup.backUp();
    const parameters = new URLSearchParams(String(request.mock.calls[0]?.[1]?.body));
    expect(Object.fromEntries(parameters)).toEqual({
      grant_type: 'refresh_token',
      refresh_token: REFRESH,
      client_id: 'synthetic-app-key',
    });
    expect(request.mock.calls[1]?.[1]?.headers).toMatchObject({ Authorization: `Bearer ${ACCESS}` });
  });

  test('reuses an unexpired token without persisting it', async () => {
    const { connect, backup, request, storage } = setup();
    await connect();
    request.mockClear();
    await backup.backUp();
    expect(request.mock.calls.some(([url]) => String(url).endsWith('/oauth2/token'))).toBe(false);
    expect(storage.length).toBe(1);
  });

  test('uploads before listing or deleting, and prunes only retention-selected app backups', async () => {
    const { connect, request, listed } = setup();
    await connect();
    const paths = request.mock.calls.map(([url]) => new URL(String(url)).pathname);
    expect(paths.slice(0, 3)).toEqual(['/oauth2/token', '/2/files/upload', '/2/files/list_folder']);
    const deleted = request.mock.calls.filter(([url]) => String(url).endsWith('/delete_v2'));
    expect(deleted.map(([, options]) => JSON.parse(String(options?.body)))).toEqual(
      listed.slice(1, 6).map((entry) => ({ path: entry.path_display })),
    );
  });

  test('failed upload leaves a pending retry and never lists or deletes anything', async () => {
    const { backup, connect, request, settings } = setup();
    request.mockImplementation(async (url) =>
      String(url).endsWith('/oauth2/token')
        ? Response.json({ access_token: ACCESS, refresh_token: REFRESH, expires_in: 3600 })
        : Response.json({ error_summary: 'sensitive-response' }, { status: 409 }),
    );
    await connect();
    expect(request).toHaveBeenCalledTimes(2);
    expect(settings()).toMatchObject({ pending: true, lastCloudBackupAt: undefined });
    expect(backup.snapshot().message).toContain('Dropbox could not save');
    expect(log.backup.error).toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(log.backup.error).mock.calls)).not.toContain('sensitive-response');
  });

  test('retention failure still records the successful upload, and leaves a pending retry', async () => {
    const { connect, backup, request, settings } = setup();
    request.mockImplementation(async (url) => {
      if (String(url).endsWith('/oauth2/token'))
        return Response.json({ access_token: ACCESS, refresh_token: REFRESH, expires_in: 3600 });
      return Response.json({}, { status: String(url).endsWith('/list_folder') ? 503 : 200 });
    });
    await connect();
    expect(settings()).toMatchObject({ pending: true, lastCloudBackupAt: NOW });
    expect(backup.snapshot().message).toContain('could not finish');
  });

  test('revoked refresh tokens clear the connection and request reconnection without logging tokens', async () => {
    const { backup, tokens, request, settings } = setup();
    tokens.write(REFRESH);
    await backup.initialize();
    request.mockResolvedValue(Response.json({ error: 'invalid_grant', error_description: REFRESH }, { status: 400 }));
    await backup.backUp();
    expect(tokens.read()).toBeUndefined();
    expect(settings()).toMatchObject({ provider: null, pending: true });
    expect(backup.snapshot()).toMatchObject({
      connected: false,
      reconnect: true,
      message: 'Reconnect Dropbox to continue automatic backups.',
    });
    expect(JSON.stringify(vi.mocked(log.backup.error).mock.calls)).not.toContain(REFRESH);
    expect(request).toHaveBeenCalledOnce();
  });

  test('temporary refresh failure keeps credentials for a later retry', async () => {
    const { backup, tokens, request } = setup();
    tokens.write(REFRESH);
    await backup.initialize();
    request.mockResolvedValue(Response.json({ error: 'temporarily_unavailable' }, { status: 503 }));
    await backup.backUp();
    expect(tokens.read()).toBe(REFRESH);
    expect(backup.snapshot().connected).toBe(true);
  });

  test('pending work resumes on app open, and online retries are quiet when nothing is pending', async () => {
    const { backup, tokens, database, request, settings } = setup();
    tokens.write(REFRESH);
    await database.updateCloudBackupSettings({ provider: 'dropbox', pending: true });
    await backup.initialize();
    expect(database.exportBackup).toHaveBeenCalledOnce();
    expect(settings().pending).toBe(false);
    request.mockClear();
    await backup.retryPending();
    expect(request).not.toHaveBeenCalled();
    await database.updateCloudBackupSettings({ pending: true });
    await backup.retryPending();
    expect(database.exportBackup).toHaveBeenCalledTimes(2);
  });

  test('a restored database without this phone’s token never uploads; it offers reconnect for pending work', async () => {
    const { backup, database, request } = setup();
    await database.updateCloudBackupSettings({ provider: 'dropbox', pending: true });
    await backup.initialize();
    await backup.retryPending();
    await backup.afterWorkout();
    expect(backup.snapshot()).toMatchObject({ connected: false, reconnect: true });
    expect(request).not.toHaveBeenCalled();
  });

  test('disconnect revokes and clears local state without deleting Dropbox files', async () => {
    const { connect, backup, tokens, request, settings } = setup();
    await connect();
    request.mockClear();
    await backup.disconnect();
    expect(request).toHaveBeenCalledExactlyOnceWith(
      'https://api.dropboxapi.com/2/auth/token/revoke',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(tokens.read()).toBeUndefined();
    expect(settings()).toEqual({ provider: null, pending: false, lastCloudBackupAt: undefined });
    expect(backup.snapshot()).toMatchObject({ connected: false, message: undefined });
  });

  test('offline disconnect retains credentials so revocation can be retried', async () => {
    const { connect, backup, tokens, request } = setup();
    await connect();
    request.mockRejectedValue(new Error(ACCESS));
    await backup.disconnect();
    expect(tokens.read()).toBe(REFRESH);
    expect(backup.snapshot()).toMatchObject({
      connected: true,
      message: 'Check your connection and try again when you are online.',
    });
    expect(JSON.stringify(vi.mocked(log.backup.error).mock.calls)).not.toContain(ACCESS);
  });

  test('changing the key revokes using the old key before saving and requires a new connection', async () => {
    const { connect, backup, tokens, request, advance, popup } = setup();
    await connect();
    advance(3_600_000);
    request.mockClear();
    await backup.saveAppKey('  another-key  ');
    const refresh = new URLSearchParams(String(request.mock.calls[0]?.[1]?.body));
    expect(refresh.get('client_id')).toBe('synthetic-app-key');
    expect(String(request.mock.calls[1]?.[0])).toContain('/token/revoke');
    expect(tokens.read()).toBeUndefined();
    expect(tokens.readAppKey()).toBe('another-key');
    expect(backup.snapshot()).toMatchObject({ connected: false, enabled: true });
    await backup.beginConnect(() => popup);
    expect(new URL(String(popup.navigate.mock.lastCall?.[0])).searchParams.get('client_id')).toBe('another-key');
  });

  test('failed revocation preserves the original key and connection', async () => {
    const { connect, backup, tokens, request } = setup();
    await connect();
    request.mockRejectedValue(new Error('offline'));
    await backup.saveAppKey('another-key');
    expect(tokens.readAppKey()).toBeUndefined();
    expect(tokens.read()).toBe(REFRESH);
    expect(backup.snapshot()).toMatchObject({ connected: true, message: expect.stringContaining('connection') });
  });

  test('saving a key enables a previously disabled coordinator', async () => {
    const { backup, tokens } = setup('');
    await backup.saveAppKey('new-key');
    expect(tokens.readAppKey()).toBe('new-key');
    expect(backup.snapshot().enabled).toBe(true);
  });

  test('backup failures are published to subscribers and unsubscribed views stop receiving changes', async () => {
    const { backup, tokens, request } = setup();
    tokens.write(REFRESH);
    await backup.initialize();
    const listener = vi.fn();
    const unsubscribe = backup.subscribe(listener);
    request.mockRejectedValue(new Error('offline'));
    await backup.afterWorkout();
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    await backup.retryPending();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('Dropbox HTTP response handling', () => {
  test('follows list-folder pagination and excludes folders/deleted entries', async () => {
    const { api, tokens, request, listed } = setup();
    tokens.write(REFRESH);
    request
      .mockResolvedValueOnce(Response.json({ access_token: ACCESS, expires_in: 3600 }))
      .mockResolvedValueOnce(
        Response.json({ entries: [listed[0], { '.tag': 'folder', name: 'folder' }], has_more: true, cursor: 'next' }),
      )
      .mockResolvedValueOnce(
        Response.json({ entries: [listed[1], { '.tag': 'deleted', name: 'removed' }], has_more: false, cursor: 'end' }),
      );
    expect(await api.list()).toEqual(
      listed
        .slice(0, 2)
        .map((entry) => ({ name: entry.name, path: entry.path_display, serverTime: entry.server_modified })),
    );
    expect(request.mock.calls[2]?.[0]).toBe('https://api.dropboxapi.com/2/files/list_folder/continue');
    expect(request.mock.calls[2]?.[1]?.body).toBe(JSON.stringify({ cursor: 'next' }));
  });

  test('unreadable or incomplete listings abort retention rather than deleting from a partial list', async () => {
    const { connect, request, backup } = setup();
    request
      .mockResolvedValueOnce(Response.json({ access_token: ACCESS, refresh_token: REFRESH, expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(Response.json({ entries: [], has_more: true }));
    await connect();
    expect(backup.snapshot().message).toContain('incomplete file list');
    expect(request).toHaveBeenCalledTimes(3);
  });

  test('401 refreshes and retries the failed request once; a second rejection clears the grant', async () => {
    const { api, connect, request, tokens } = setup();
    await connect();
    request.mockClear();
    request
      .mockResolvedValueOnce(Response.json({}, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ access_token: 'new-access', expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({}));
    await api.upload('backup.sqlite', new Uint8Array());
    expect(request.mock.calls[2]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer new-access' });
    request.mockClear();
    request
      .mockResolvedValueOnce(Response.json({}, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ access_token: 'new-access', expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({}, { status: 401 }));
    await expect(api.upload('backup.sqlite', new Uint8Array())).rejects.toMatchObject({ kind: 'revoked' });
    expect(tokens.read()).toBeUndefined();
    expect(request).toHaveBeenCalledTimes(3);
  });

  test('malformed successful credentials never become a stored connection', async () => {
    const { api, tokens, request } = setup();
    request.mockResolvedValue(Response.json({ access_token: ACCESS, refresh_token: REFRESH, expires_in: 'bad' }));
    await expect(api.exchange('code', 'verifier')).rejects.toThrow('unreadable credentials');
    expect(tokens.read()).toBeUndefined();
  });
});
