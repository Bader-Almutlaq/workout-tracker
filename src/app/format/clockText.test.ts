import { describe, expect, test } from 'vitest';
import { clockText } from './clockText';

describe('clock text', () => {
  test('Under an hour it reads minutes and seconds', () => {
    expect(clockText(0)).toBe('0:00');
    expect(clockText(5)).toBe('0:05');
    expect(clockText(303)).toBe('5:03');
    expect(clockText(3599)).toBe('59:59');
  });

  test('From one hour up it gains an hours part', () => {
    expect(clockText(3600)).toBe('1:00:00');
    expect(clockText(3903)).toBe('1:05:03');
    expect(clockText(36_000)).toBe('10:00:00');
  });

  test('Fractions are dropped and negative values read as zero', () => {
    expect(clockText(59.9)).toBe('0:59');
    expect(clockText(-4)).toBe('0:00');
  });
});
