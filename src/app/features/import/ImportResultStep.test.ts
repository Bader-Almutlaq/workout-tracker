import { expect, test } from 'vitest';
import { setsLeftOutText } from './ImportResultStep';

test('formats the number of sets left out', () => {
  expect(setsLeftOutText(0)).toBe('0 sets left out');
  expect(setsLeftOutText(1)).toBe('1 set left out');
  expect(setsLeftOutText(1234)).toBe('1,234 sets left out');
});
