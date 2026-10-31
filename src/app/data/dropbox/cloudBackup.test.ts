import { afterEach, expect, test, vi } from 'vitest';

const calls = vi.hoisted(() => ({
  enabled: true,
  handleRedirect: vi.fn<(redirectUri: string, currentUrl: string, replace: (url: string) => void) => Promise<void>>(
    async () => undefined,
  ),
  initialize: vi.fn(async () => undefined),
  retryPending: vi.fn(async () => undefined),
}));
vi.mock('./effectiveDropboxAppKey', () => ({ effectiveDropboxAppKey: () => 'key' }));
vi.mock('../database', () => ({ database: {} }));
vi.mock('./DropboxBackup', () => ({
  DropboxBackup: class {
    snapshot = () => ({ enabled: calls.enabled });
    initialize = calls.initialize;
    handleRedirect = calls.handleRedirect;
    retryPending = calls.retryPending;
  },
}));

// This tests only app-lifetime event wiring. The real coordinator and HTTP client are tested separately.
afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function browserAt(url = 'http://localhost:5173/settings') {
  return Object.assign(new EventTarget(), {
    location: new URL(url),
    history: { state: { synthetic: true }, replaceState: vi.fn() },
  });
}

test('enabled runtime initializes once and forwards online events without a mounted screen', async () => {
  calls.enabled = true;
  const browser = browserAt();
  vi.stubGlobal('window', browser);
  await import('./cloudBackup');
  expect(calls.initialize).toHaveBeenCalledOnce();
  browser.dispatchEvent(new Event('online'));
  expect(calls.retryPending).toHaveBeenCalledOnce();
});

test('disabled runtime retains startup and online wiring for a key added later', async () => {
  calls.enabled = false;
  const browser = browserAt();
  vi.stubGlobal('window', browser);
  await import('./cloudBackup');
  browser.dispatchEvent(new Event('online'));
  expect(calls.initialize).toHaveBeenCalledOnce();
  expect(calls.retryPending).toHaveBeenCalledOnce();
});

test('startup hands the Settings query to the coordinator before initializing and uses the deployment base', async () => {
  vi.stubEnv('BASE_URL', '/workout-tracker/');
  const browser = browserAt('https://example.com/workout-tracker/settings?code=synthetic&state=synthetic');
  vi.stubGlobal('window', browser);
  calls.handleRedirect.mockImplementationOnce(async (redirectUri, currentUrl, replace) => {
    expect(redirectUri).toBe('https://example.com/workout-tracker/settings');
    expect(currentUrl).toBe(browser.location.href);
    expect(calls.initialize).not.toHaveBeenCalled();
    replace('/workout-tracker/settings');
  });
  const { dropboxRedirectUri } = await import('./cloudBackup');
  expect(dropboxRedirectUri).toBe('https://example.com/workout-tracker/settings');
  expect(browser.history.replaceState).toHaveBeenCalledExactlyOnceWith(
    browser.history.state,
    '',
    '/workout-tracker/settings',
  );
  expect(calls.handleRedirect).toHaveBeenCalledOnce();
  expect(calls.initialize).toHaveBeenCalledOnce();
});
