import { describe, expect, test } from 'vitest';
import { KILOGRAMS_PER_POUND, WEIGHT_UNITS, toggledWeightUnit } from './WeightUnit';

describe('WeightUnit', () => {
  test('Toggle flips the unit', () => {
    expect(toggledWeightUnit('kg')).toBe('lb');
    expect(toggledWeightUnit('lb')).toBe('kg');
  });

  test('Both units are listed, as stored in the database', () => {
    expect(WEIGHT_UNITS).toEqual(['kg', 'lb']);
  });

  test('The pound factor is the exact 1959 definition', () => {
    expect(KILOGRAMS_PER_POUND).toBe(0.45359237);
  });
});
