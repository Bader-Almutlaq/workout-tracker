import { expect, test } from 'vitest';
import { changeText, comparisonVolumeText } from './workoutComparisonText';

test('formats descriptive signed changes and omits undefined percentages', () => {
  expect(comparisonVolumeText(8420, 7943)).toBe('Volume 8,420 kg (+6%)');
  expect(changeText(90, 100)).toBe(' (-10%)');
  expect(changeText(1, 0)).toBe('');
});
