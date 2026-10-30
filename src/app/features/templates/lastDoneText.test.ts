import { describe, expect, test } from 'vitest';
import { lastDoneText } from './lastDoneText';

const now = new Date(2026, 9, 30, 9, 0);

function daysAgo(days: number, hour = 18): string {
  return new Date(2026, 9, 30 - days, hour, 0).toISOString();
}

describe('last done text', () => {
  test('A template that was never started says nothing', () => {
    expect(lastDoneText(null, now)).toBeUndefined();
  });

  test('Today and yesterday are named, then it counts days', () => {
    expect(lastDoneText(daysAgo(0, 6), now)).toBe('Last done today');
    expect(lastDoneText(daysAgo(1), now)).toBe('Last done yesterday');
    expect(lastDoneText(daysAgo(3), now)).toBe('Last done 3 days ago');
  });

  test('Late yesterday is one day ago even when fewer than 24 hours have passed', () => {
    expect(lastDoneText(daysAgo(1, 23), now)).toBe('Last done yesterday');
  });

  test('Past two weeks it counts weeks, then months, then years', () => {
    expect(lastDoneText(daysAgo(14), now)).toBe('Last done 2 weeks ago');
    expect(lastDoneText(daysAgo(60), now)).toBe('Last done 2 months ago');
    expect(lastDoneText(daysAgo(400), now)).toBe('Last done last year');
  });

  test('A start time in the future reads as today', () => {
    expect(lastDoneText(daysAgo(-2), now)).toBe('Last done today');
  });
});
