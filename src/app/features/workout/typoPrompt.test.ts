import { describe, expect, test } from 'vitest';
import { toKilograms } from '../../../core/units/Weight';
import { typoPromptField, typoPromptFor } from './typoPrompt';
import { makeSet } from './workoutTestData';

describe('typo prompt', () => {
  test('A weight that is too high quotes the weight and offers the correction', () => {
    const set = makeSet({ id: 7, weightKilograms: 1000, entryUnit: 'kg', reps: 5 });
    const prompt = typoPromptFor({ id: 0, issue: 'weightTooHigh', typical: 100, suggestion: 100 }, set);
    expect(prompt).toEqual({
      setId: 7,
      field: 'weight',
      message: '1,000 kg is far above your usual 100 kg. Did you mean 100 kg?',
    });
  });

  test('Weights are quoted in the unit the set was typed in', () => {
    const set = makeSet({ weightKilograms: toKilograms(1000, 'lb'), entryUnit: 'lb' });
    const prompt = typoPromptFor(
      { id: 0, issue: 'weightTooHigh', typical: toKilograms(100, 'lb'), suggestion: toKilograms(100, 'lb') },
      set,
    );
    expect(prompt.message).toBe('1,000 lb is far above your usual 100 lb. Did you mean 100 lb?');
  });

  test('A weight that is too low says so and leaves out a missing suggestion', () => {
    const prompt = typoPromptFor(
      { id: 0, issue: 'weightTooLow', typical: 100, suggestion: null },
      makeSet({ weightKilograms: 7 }),
    );
    expect(prompt.message).toBe('7 kg is far below your usual 100 kg.');
  });

  test('Too many reps point at the reps cell', () => {
    const finding = { id: 0, issue: 'repsTooHigh', typical: 8, suggestion: 8 } as const;
    const prompt = typoPromptFor(finding, makeSet({ reps: 80 }));
    expect(prompt.message).toBe('80 reps is far above your usual 8. Did you mean 8?');
    expect(prompt.field).toBe('reps');
    expect(typoPromptField({ id: 0, issue: 'weightTooLow', typical: 1, suggestion: null })).toBe('weight');
  });
});
