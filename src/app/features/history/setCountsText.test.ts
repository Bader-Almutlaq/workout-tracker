import { expect, it } from 'vitest';
import { setCountsText } from './setCountsText';

it('formats work sets and optional warm-ups with singular and plural labels', () => {
  expect(setCountsText(0, 0)).toBe('0 sets');
  expect(setCountsText(1, 1)).toBe('1 set · 1 warm-up');
  expect(setCountsText(3, 2)).toBe('3 sets · 2 warm-ups');
});
