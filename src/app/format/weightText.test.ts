import { describe, expect, test } from 'vitest';
import { toKilograms } from '../../core/units/Weight';
import { volumeText, weightNumberText, weightText } from './weightText';

describe('weight text', () => {
  test('Pounds typed as 135 read as 135 lb, not 134.99', () => {
    expect(weightText(toKilograms(135, 'lb'), 'lb')).toBe('135 lb');
    expect(weightText(61.23, 'lb')).toBe('135 lb');
  });

  test('Kilograms keep up to two decimals and drop trailing zeros', () => {
    expect(weightText(102.5, 'kg')).toBe('102.5 kg');
    expect(weightText(60, 'kg')).toBe('60 kg');
    expect(weightText(63.93, 'kg')).toBe('63.93 kg');
  });

  test('The number alone has no unit', () => {
    expect(weightNumberText(140 * 0.45359237, 'lb')).toBe('140');
  });

  test('Volume is whole kilograms with a thousands separator', () => {
    expect(volumeText(1234.56)).toBe('1,235 kg');
    expect(volumeText(0)).toBe('0 kg');
  });
});
