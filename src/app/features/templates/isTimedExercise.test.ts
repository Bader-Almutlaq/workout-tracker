import { expect, test } from 'vitest';
import { isTimedExercise } from './isTimedExercise';
import { targetPadTitle } from './targetPadText';

test('Only duration tracking uses seconds labels', () => {
  expect(isTimedExercise('duration')).toBe(true);
  expect(isTimedExercise('weight-duration')).toBe(true);
  expect(isTimedExercise('weight-reps')).toBe(false);
  expect(isTimedExercise('bodyweight-reps')).toBe(false);
  expect(isTimedExercise(undefined)).toBe(false);
  expect(targetPadTitle('repsLow', true)).toBe('Seconds from');
  expect(targetPadTitle('repsHigh', true)).toBe('Seconds to');
  expect(targetPadTitle('rpe', true)).toBe('RPE');
});
