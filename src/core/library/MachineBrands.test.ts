import { describe, expect, test } from 'vitest';
import { EQUIPMENT } from './Equipment';
import { MACHINE_BRANDS, MachineBrandError, normalizeMachineBrand, usesMachineBrand } from './MachineBrands';

describe('machine manufacturers', () => {
  test('the convenience list is frozen and alphabetically sorted', () => {
    expect(Object.isFrozen(MACHINE_BRANDS)).toBe(true);
    expect([...MACHINE_BRANDS].sort((a, b) => a.localeCompare(b))).toEqual(MACHINE_BRANDS);
  });

  test('only machine equipment uses a manufacturer', () => {
    for (const equipment of EQUIPMENT) {
      expect(usesMachineBrand(equipment)).toBe(
        ['machine', 'plate-loaded', 'cable', 'smith-machine'].includes(equipment),
      );
    }
    expect(usesMachineBrand(null)).toBe(false);
  });

  test('normalizes names and validates their length', () => {
    expect(normalizeMachineBrand('  hammer   strength  ')).toBe('Hammer Strength');
    expect(normalizeMachineBrand('  My   Machine ')).toBe('My Machine');
    expect(normalizeMachineBrand('  ')).toBeNull();
    expect(normalizeMachineBrand('x'.repeat(40))).toHaveLength(40);
    expect(() => normalizeMachineBrand('x'.repeat(41))).toThrow(MachineBrandError);
  });
});
