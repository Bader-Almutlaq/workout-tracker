import { afterEach, describe, expect, test, vi } from 'vitest';
import { localDateKey } from './localDate';

describe('localDateKey', () => {
  afterEach(() => vi.unstubAllEnvs());

  test('uses the phone’s time zone, not UTC', () => {
    vi.stubEnv('TZ', 'Asia/Riyadh');
    // 22:30 in Riyadh on 30 October is 19:30 UTC the same day; 01:30 on the 31st is 22:30 UTC on the 30th.
    expect(localDateKey('2026-10-30T19:30:00.000Z')).toBe('2026-10-30');
    expect(localDateKey('2026-10-30T22:30:00.000Z')).toBe('2026-10-31');
  });

  test('pads single-digit months and days', () => {
    vi.stubEnv('TZ', 'UTC');
    expect(localDateKey(new Date('2026-01-05T12:00:00.000Z'))).toBe('2026-01-05');
  });
});
