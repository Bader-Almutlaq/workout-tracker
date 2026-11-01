import { describe, expect, test } from 'vitest';
import { padTitle } from './padTitle';

describe('pad title', () => {
  test('Weight names its unit', () => {
    expect(padTitle('weight', 'weight-reps', 'lb')).toBe('Weight · lb');
    expect(padTitle('weight', 'bodyweight-reps', 'kg')).toBe('Added weight · kg');
  });

  test('The second cell is reps, or seconds for timed exercises', () => {
    expect(padTitle('reps', 'weight-reps', 'kg')).toBe('Reps');
    expect(padTitle('reps', 'duration', 'kg')).toBe('Seconds');
    expect(padTitle('reps', 'weight-duration', 'kg')).toBe('Seconds');
  });

  test('RPE is just RPE', () => {
    expect(padTitle('rpe', 'weight-reps', 'kg')).toBe('RPE');
  });
});

test('RPE title shows remaining reps for a typed effort', () => {
  expect(padTitle('rpe', 'weight-reps', 'kg', '8.5')).toBe('RPE 8.5 · 1.5 reps left');
});
