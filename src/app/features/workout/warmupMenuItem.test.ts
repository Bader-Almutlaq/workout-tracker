import { expect, test, vi } from 'vitest';
import { makeSet } from './workoutTestData';
import { warmupMenuItem } from './warmupMenuItem';

test('warm-up menu requires a working weight, and switches to removal when warm-ups exist', () => {
  const toggle = vi.fn();
  const disabled = warmupMenuItem([makeSet({ kind: 'working', weightKilograms: 0 })], toggle);
  expect(disabled.isDisabled).toBe(true);
  expect(disabled.label).toContain('enter a working weight first');
  const add = warmupMenuItem([makeSet({ kind: 'working', weightKilograms: 100 })], toggle);
  expect(add.isDisabled).toBe(false);
  expect(add.label).toBe('Add warm-up sets');
  add.onSelect();
  const remove = warmupMenuItem([makeSet({ kind: 'warmup' })], toggle);
  expect(remove.label).toBe('Remove suggested warm-ups');
  expect(remove.isDisabled).toBe(false);
  remove.onSelect();
  expect(toggle.mock.calls).toEqual([[false], [true]]);
});
