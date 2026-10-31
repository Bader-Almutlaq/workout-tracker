import { afterEach, describe, expect, it, vi } from 'vitest';
import { DropboxApi } from './DropboxApi';
import { DropboxTokenStore } from './DropboxTokenStore';

/** A Storage stand-in that keeps values in memory. */
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

const tokenResponse = { access_token: 'access', expires_in: 14_400, refresh_token: 'refresh' };

describe('DropboxApi default request', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('calls the browser fetch without rebinding it (regression: every request said "No connection")', async () => {
    // Browsers throw "Illegal invocation" when fetch runs with another object as `this`.
    const browserFetch = vi.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) return Promise.reject(new TypeError('Illegal invocation'));
      return Promise.resolve(new Response(JSON.stringify(tokenResponse), { status: 200 }));
    });
    vi.stubGlobal('fetch', browserFetch);
    const storage = memoryStorage();
    const tokens = new DropboxTokenStore(() => storage);
    await new DropboxApi('appkey12345', tokens).exchange('code', 'verifier');
    expect(browserFetch).toHaveBeenCalledOnce();
    expect(tokens.read()).toBe('refresh');
  });

  it('names the reason when a request fails while online', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Load failed')));
    const api = new DropboxApi('appkey12345', new DropboxTokenStore(() => memoryStorage()));
    await expect(api.exchange('code', 'verifier')).rejects.toThrow("Dropbox couldn't be reached (Load failed).");
  });
});
