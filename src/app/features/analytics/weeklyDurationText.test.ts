import { expect, test } from 'vitest';
import { weeklyDurationText } from './weeklyDurationText';
test('formats weekly duration including positive sub-minute averages', () => {
  expect(weeklyDurationText(5)).toBe('<1m');
  expect(weeklyDurationText(0)).toBe('0m');
  expect(weeklyDurationText(2700)).toBe('45m');
  expect(weeklyDurationText(4800)).toBe('1h 20m');
});
