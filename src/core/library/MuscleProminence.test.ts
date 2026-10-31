import { describe, expect, test } from 'vitest';
import { isMainMuscle, SMALLER_MUSCLES } from './MuscleProminence';

describe('muscle prominence', () => {
  test('hides the owner’s eight smaller muscles from main lists', () => {
    expect(SMALLER_MUSCLES).toHaveLength(8);
    expect(SMALLER_MUSCLES.every((muscle) => !isMainMuscle(muscle))).toBe(true);
    expect(isMainMuscle('chest')).toBe(true);
  });
});
