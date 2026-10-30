import { describe, expect, test } from 'vitest';
import { toKilograms } from '../../../core/units/Weight';
import { setValuesOf, withTypedValue } from './setValues';
import { makeSet } from './workoutTestData';

const lbValues = setValuesOf(makeSet({ weightKilograms: 60, entryUnit: 'lb', reps: 8, rpe: 7, kind: 'drop' }));

describe('typed values', () => {
  test('A weight typed in lb is stored as kilograms through the unit conversion', () => {
    const edit = withTypedValue(lbValues, 'weight', 135, 'weight-reps');
    expect(edit).toEqual({ isValid: true, values: { ...lbValues, weightKilograms: toKilograms(135, 'lb') } });
  });

  test('A weight typed in kg is stored as typed, and empty means 0', () => {
    const kg = { ...lbValues, entryUnit: 'kg' } as const;
    expect(withTypedValue(kg, 'weight', 102.5, 'weight-reps')).toMatchObject({ values: { weightKilograms: 102.5 } });
    expect(withTypedValue(kg, 'weight', null, 'weight-reps')).toMatchObject({ values: { weightKilograms: 0 } });
  });

  test('Other fields are left as they were', () => {
    const edit = withTypedValue(lbValues, 'weight', 100, 'weight-reps');
    expect(edit).toMatchObject({ values: { reps: 8, rpe: 7, kind: 'drop', entryUnit: 'lb' } });
  });

  test('Reps are whole numbers', () => {
    expect(withTypedValue(lbValues, 'reps', 10, 'weight-reps')).toMatchObject({ values: { reps: 10 } });
    expect(withTypedValue(lbValues, 'reps', null, 'weight-reps')).toMatchObject({ values: { reps: 0 } });
  });

  test('For timed exercises the cell holds seconds and reps stay 0', () => {
    expect(withTypedValue(lbValues, 'reps', 90, 'duration')).toMatchObject({
      values: { durationSeconds: 90, reps: 0 },
    });
    expect(withTypedValue(lbValues, 'reps', 45, 'weight-duration')).toMatchObject({
      values: { durationSeconds: 45, reps: 0 },
    });
  });

  test('RPE accepts half steps and empty', () => {
    expect(withTypedValue(lbValues, 'rpe', 8.5, 'weight-reps')).toMatchObject({ values: { rpe: 8.5 } });
    expect(withTypedValue(lbValues, 'rpe', 9, 'weight-reps')).toMatchObject({ values: { rpe: 9 } });
    expect(withTypedValue(lbValues, 'rpe', null, 'weight-reps')).toMatchObject({ values: { rpe: null } });
  });

  test('RPE off the half-step grid is refused with a message', () => {
    expect(withTypedValue(lbValues, 'rpe', 7.3, 'weight-reps')).toEqual({
      isValid: false,
      message: 'RPE goes in half steps, such as 7 or 7.5 (got 7.3).',
    });
  });
});
