import { expect, test } from 'vitest';
import { estimateText } from './estimateText';

test('rounds estimates to 0.5 kg or 1 lb with at most one decimal', () => {
  expect(estimateText(133.66, 'kg')).toBe('133.5 kg');
  expect(estimateText(131.03, 'kg')).toBe('131 kg');
  expect(estimateText(133.66, 'lb')).toBe('295 lb');
});
