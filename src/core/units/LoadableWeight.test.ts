import { describe, expect, test } from 'vitest';
import type { Equipment } from '../library/Equipment';
import { displayValue, toKilograms } from './Weight';
import { isBarEquipment, loadableWeights, loadProfileFor, roundToLoadable } from './LoadableWeight';

const barbell = loadProfileFor({ equipment: 'barbell' }, 'kg');

describe('loadable weight ladders', () => {
  test.each([
    [61, 'down', 60],
    [61, 'nearest', 60],
    [61.3, 'nearest', 62.5],
    [61.25, 'nearest', 60],
    [0, 'down', 20],
    [-5, 'nearest', 20],
  ] as const)('barbell %s kg, %s → %s', (weight, mode, expected) => {
    expect(roundToLoadable(weight, barbell, mode)).toBe(expected);
  });

  test('dumbbell rounds down and clamps to the smallest dumbbell', () => {
    const profile = loadProfileFor({ equipment: 'dumbbell' }, 'kg');
    expect(roundToLoadable(13.7, profile, 'down')).toBe(12.5);
    expect(roundToLoadable(0, profile, 'nearest')).toBe(2.5);
  });

  test('pound barbell uses exact converted 45 + 5n lb, with downward ties', () => {
    const profile = loadProfileFor({ equipment: 'barbell' }, 'lb');
    expect(displayValue(roundToLoadable(toKilograms(137, 'lb'), profile, 'nearest'), 'lb')).toBe(135);
    expect(displayValue(roundToLoadable(toKilograms(137.5, 'lb'), profile, 'nearest'), 'lb')).toBe(135);
    expect(displayValue(roundToLoadable(0, profile, 'down'), 'lb')).toBe(45);
    expect(roundToLoadable(toKilograms(140, 'lb'), profile, 'down')).toBeCloseTo(toKilograms(140, 'lb'), 12);
  });

  test.each(['bodyweight', 'weighted', 'assisted', 'band', 'plate', null] as const)(
    '%s has no rounding',
    (equipment) => {
      const profile = loadProfileFor({ equipment, loadStepKilograms: 3 }, 'kg');
      expect(roundToLoadable(13.713, profile, 'down')).toBe(13.713);
      expect(roundToLoadable(0, profile, 'nearest')).toBe(0);
      expect(loadableWeights(profile, 50)).toEqual([]);
    },
  );

  test.each<[Equipment, number, number]>([
    ['ez-bar', 10, 2.5],
    ['trap-bar', 25, 2.5],
    ['safety-bar', 30, 2.5],
    ['smith-machine', 15, 2.5],
    ['plate-loaded', 0, 2.5],
    ['landmine', 20, 1.25],
    ['kettlebell', 4, 4],
    ['machine', 5, 5],
    ['cable', 5, 5],
  ])('%s defaults to %s + n × %s kg', (equipment, minimum, step) => {
    expect(loadProfileFor({ equipment }, 'kg')).toEqual({ minimumKilograms: minimum, stepKilograms: step });
  });

  test('other bars retain their kg empty weight in lb profiles; dumbbells/stacks use lb steps', () => {
    expect(loadProfileFor({ equipment: 'ez-bar' }, 'lb').minimumKilograms).toBe(10);
    expect(loadProfileFor({ equipment: 'machine' }, 'lb').stepKilograms).toBe(toKilograms(10, 'lb'));
    expect(loadProfileFor({ equipment: 'dumbbell' }, 'lb').minimumKilograms).toBe(toKilograms(5, 'lb'));
  });

  test('exact kg overrides change the ladder origin and increment without snapping', () => {
    const profile = loadProfileFor({ equipment: 'barbell', barWeightKilograms: 17, loadStepKilograms: 3 }, 'lb');
    expect(profile).toEqual({ minimumKilograms: 17, stepKilograms: 3 });
    expect(roundToLoadable(24, profile, 'down')).toBe(23);
    expect(loadProfileFor({ equipment: 'dumbbell', loadStepKilograms: 2 }, 'kg').minimumKilograms).toBe(2);
  });

  test('bounded ladder includes an exactly loadable ceiling and no value above it', () => {
    expect(loadableWeights(barbell, 26)).toEqual([20, 22.5, 25]);
    expect(loadableWeights(barbell, 25)).toEqual([20, 22.5, 25]);
    expect(loadableWeights(barbell, 19)).toEqual([]);
    expect(loadableWeights(barbell, Infinity)).toEqual([]);
    expect(isBarEquipment('landmine')).toBe(true);
    expect(isBarEquipment('cable')).toBe(false);
  });
});
