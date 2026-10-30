import { describe, expect, test } from 'vitest';
import type { BodyMeasurement } from '../models/BodyMeasurement';
import { measurementChange, MeasurementChangePolicy } from './MeasurementChange';

function entry(day: number, value: number, state: 'relaxed' | 'flexed' = 'relaxed'): BodyMeasurement {
  return {
    id: day,
    takenAt: new Date(Date.UTC(2026, 0, day)).toISOString(),
    site: 'waist',
    value,
    state,
    source: 'app',
    entryUnit: 'cm',
  };
}

describe('measurementChange', () => {
  test('no data or only the other state gives nulls', () => {
    expect(measurementChange([], 'relaxed')).toEqual({
      latest: null,
      first: null,
      fourWeeksReference: null,
      twelveWeeksReference: null,
      sinceFirst: null,
      fourWeeks: null,
      twelveWeeks: null,
      perMonth: null,
    });
    expect(measurementChange([entry(1, 10, 'flexed')], 'relaxed').latest).toBeNull();
  });
  test('one point has a latest value but no comparisons', () => {
    const result = measurementChange([entry(1, 10)], 'relaxed');
    expect(result.latest?.value).toBe(10);
    expect(result.sinceFirst).toBeNull();
    expect(result.perMonth).toBeNull();
    expect(result.fourWeeks).toBeNull();
  });
  test('hand-computed changes use the newest observation on or before each cutoff, per state', () => {
    const entries = [entry(1, 10), entry(2, 11), entry(57, 20), entry(58, 99), entry(85, 24), entry(85, 200, 'flexed')];
    const result = measurementChange(entries.toReversed(), 'relaxed');
    expect(result.latest?.value).toBe(24);
    expect(result.sinceFirst).toBe(14);
    expect(result.fourWeeks).toBe(4);
    expect(result.fourWeeksReference?.value).toBe(20);
    expect(result.twelveWeeksReference?.value).toBe(10);
    expect(result.first?.value).toBe(10);
    expect(result.twelveWeeks).toBe(14);
    expect(entries[0]?.value).toBe(10);
  });
  test('sparse history uses an older baseline; missing older baselines stay null', () => {
    expect(measurementChange([entry(1, 10), entry(90, 13)], 'relaxed').fourWeeks).toBe(3);
    const result = measurementChange([entry(1, 10), entry(3, 13)], 'relaxed');
    expect(result.fourWeeks).toBeNull();
    expect(result.twelveWeeks).toBeNull();
  });
  test('least-squares slope uses all observations in the inclusive 12-week window', () => {
    // Days 1, 29, 57, 85: values 10, 12, 14, 16 => slope 2/28 cm/day.
    const entries = [entry(-1, 900), entry(1, 10), entry(29, 12), entry(57, 14), entry(85, 16)];
    expect(measurementChange(entries, 'relaxed').perMonth).toBeCloseTo(
      (2 / 28) * MeasurementChangePolicy.daysPerMonth,
      12,
    );
  });
  test('no distinct timestamps or only one recent observation gives a null monthly rate', () => {
    expect(measurementChange([entry(1, 10), entry(1, 11)], 'relaxed').perMonth).toBeNull();
    expect(measurementChange([entry(1, 10), entry(100, 11)], 'relaxed').perMonth).toBeNull();
  });
  test('least squares differs from endpoint rate for uneven observations', () => {
    // x = 0,1,3; y = 1,4,4; numerator = 4, denominator = 14/3 => slope 6/7.
    expect(measurementChange([entry(1, 1), entry(2, 4), entry(4, 4)], 'relaxed').perMonth).toBeCloseTo(
      (6 / 7) * MeasurementChangePolicy.daysPerMonth,
      12,
    );
  });
});
