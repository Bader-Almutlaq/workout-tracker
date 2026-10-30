import { describe, expect, test } from 'vitest';
import { summaryPath } from './workoutPaths';

describe('workout paths', () => {
  test('A finished workout has its own summary address', () => {
    expect(summaryPath(42)).toBe('/workout/summary/42');
  });

  test('A discarded workout goes to the notice without an id', () => {
    expect(summaryPath(null)).toBe('/workout/summary');
  });
});
