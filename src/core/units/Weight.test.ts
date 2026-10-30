import { describe, expect, test } from 'vitest';
import { displayValue, inferEntryUnit, toKilograms, valueIn } from './Weight';

describe('Weight conversion and entry-unit inference', () => {
  test.each([
    [135, 61.23496995],
    [225, 102.05828325],
    [2.5, 1.133980925],
  ])('%d lb retains unrounded kilograms and round-trips to the typed display', (pounds, kilograms) => {
    // Hand multiplication by the exact 0.45359237 kg/lb definition, not a rounded CSV value.
    const stored = toKilograms(pounds, 'lb');
    expect(stored).toBeCloseTo(kilograms, 12);
    expect(valueIn(stored, 'lb')).toBeCloseTo(pounds, 12);
    expect(displayValue(stored, 'lb')).toBe(pounds);
  });

  test('display snapping never rounds the kilograms kept for storage', () => {
    const stored = toKilograms(102.499, 'kg');
    expect(stored).toBe(102.499);
    expect(displayValue(stored, 'kg')).toBe(102.5);
    expect(stored).toBe(102.499);
  });

  test('Pounds convert to kilograms with the exact 1959 factor', () => {
    expect(toKilograms(135, 'lb')).toBe(135 * 0.45359237);
    expect(toKilograms(100, 'kg')).toBe(100);
  });

  test('Round trip kg → lb → kg is lossless', () => {
    const pounds = valueIn(102.5, 'lb');
    expect(Math.abs(toKilograms(pounds, 'lb') - 102.5)).toBeLessThan(1e-9);
  });

  test.each([
    [61.23, 135.0],
    [49.9, 110.0],
    [47.17, 104.0],
    [27.22, 60.0],
  ])("Display snaps Strong's rounded conversions back to what was typed (%d kg → %d lb)", (kilograms, pounds) => {
    expect(displayValue(kilograms, 'lb')).toBe(pounds);
  });

  test('Display keeps non-round values to two decimals', () => {
    expect(displayValue(20.4, 'lb')).toBe(44.97);
  });

  test.each([
    [0.0, 'kg'],
    [102.5, 'kg'],
    [61.25, 'kg'],
    [140.0, 'lb'],
    [121.25, 'lb'],
  ] as const)("Round values are inferred as typed in the column's unit (%d in %s)", (value, column) => {
    expect(inferEntryUnit(value, column)).toBe(column);
  });

  test.each([61.23, 49.9, 47.17, 27.22, 54.43])(
    'In a kg column, Strong-converted whole pounds are inferred as typed in lb (%d)',
    (value) => {
      expect(inferEntryUnit(value, 'kg')).toBe('lb');
    },
  );

  test.each([99.21, 63.93, 35.27, 70.55, 119.05])(
    'In a lb column, Strong-converted kilograms are inferred as typed in kg (%d)',
    (value) => {
      expect(inferEntryUnit(value, 'lb')).toBe('kg');
    },
  );

  test('Values that fit neither grid are not guessed', () => {
    expect(inferEntryUnit(99.21, 'kg')).toBeUndefined();
    expect(inferEntryUnit(41.3, 'kg')).toBeUndefined();
    expect(inferEntryUnit(61.23, 'lb')).toBeUndefined();
  });
});
