import { afterEach, describe, expect, test, vi } from 'vitest';
import { parseStrongTimestamp } from './StrongTimestamp';

// Strong timestamps are local time, so results depend on the zone: pin it, whatever the Mac uses.
vi.stubEnv('TZ', 'UTC');
afterEach(() => vi.stubEnv('TZ', 'UTC'));

describe('Strong timestamps', () => {
  test('the pinned zone really is applied', () => {
    expect(parseStrongTimestamp('2024-01-01 10:00:00')).toBe('2024-01-01T10:00:00.000Z');
  });

  test('local time is read in the device zone, including daylight saving', () => {
    vi.stubEnv('TZ', 'America/New_York');
    expect(parseStrongTimestamp('2024-01-01 10:00:00')).toBe('2024-01-01T15:00:00.000Z');
    expect(parseStrongTimestamp('2024-07-01 10:00:00')).toBe('2024-07-01T14:00:00.000Z');
  });

  test('a zone ahead of UTC moves the instant earlier', () => {
    vi.stubEnv('TZ', 'Asia/Riyadh');
    expect(parseStrongTimestamp('2021-11-20 20:53:38')).toBe('2021-11-20T17:53:38.000Z');
  });

  test('a time that happens twice takes the first occurrence; a skipped time moves forward', () => {
    vi.stubEnv('TZ', 'America/New_York');
    expect(parseStrongTimestamp('2024-11-03 01:30:00')).toBe('2024-11-03T05:30:00.000Z');
    expect(parseStrongTimestamp('2024-03-10 02:30:00')).toBe('2024-03-10T07:30:00.000Z');
  });

  test('leap days are accepted only in leap years', () => {
    expect(parseStrongTimestamp('2024-02-29 00:00:00')).toBe('2024-02-29T00:00:00.000Z');
    expect(parseStrongTimestamp('2023-02-29 00:00:00')).toBeUndefined();
    expect(parseStrongTimestamp('2100-02-29 00:00:00')).toBeUndefined();
    expect(parseStrongTimestamp('2000-02-29 00:00:00')).toBe('2000-02-29T00:00:00.000Z');
  });

  test.each([
    '',
    '01/02/2024',
    '2024-01-01',
    '2024-01-01T10:00:00',
    '2024-13-01 10:00:00',
    '2024-00-01 10:00:00',
    '2024-04-31 10:00:00',
    '2024-01-00 10:00:00',
    '2024-01-01 24:00:00',
    '2024-01-01 10:60:00',
    '2024-01-01 10:00:60',
    '2024-01-01 10:00:00 ',
  ])('refuses "%s"', (text) => {
    expect(parseStrongTimestamp(text)).toBeUndefined();
  });
});
