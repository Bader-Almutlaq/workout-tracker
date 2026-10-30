import { describe, expect, test } from 'vitest';
import { NumberPadSteps, padRange } from './padRange';

describe('pad range', () => {
  test('Weight steps by 2.5 kg or 5 lb', () => {
    expect(padRange('weight', 'kg').step).toBe(NumberPadSteps.kilograms);
    expect(padRange('weight', 'kg').step).toBe(2.5);
    expect(padRange('weight', 'lb').step).toBe(5);
  });

  test('Reps step by one and RPE by half', () => {
    expect(padRange('reps', 'kg').step).toBe(1);
    expect(padRange('rpe', 'lb').step).toBe(0.5);
  });

  test('The weight ceiling is the logger limit in the set unit', () => {
    expect(padRange('weight', 'kg').maximum).toBe(1000);
    expect(padRange('weight', 'lb').maximum).toBeCloseTo(2204.62, 2);
  });

  test('Reps run from 0 to the logger limit and RPE from 1 to 10', () => {
    expect(padRange('reps', 'kg')).toMatchObject({ minimum: 0, maximum: 1000 });
    expect(padRange('rpe', 'kg')).toMatchObject({ minimum: 1, maximum: 10 });
  });
});
