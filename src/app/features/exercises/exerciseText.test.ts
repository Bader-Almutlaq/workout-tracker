import { describe, expect, test } from 'vitest';
import { exerciseSubtitle, exerciseTraitsText, searchPlaceholder, topSetText, usageText } from './exerciseText';

describe('exercise text', () => {
  test('The search prompt rounds the count down to the nearest ten', () => {
    expect(searchPlaceholder(423)).toBe('Search 420 exercises');
    expect(searchPlaceholder(420)).toBe('Search 420 exercises');
    expect(searchPlaceholder(9)).toBe('Search 0 exercises');
  });

  test('A row lists the primary muscles then the usage count', () => {
    expect(exerciseSubtitle({ primaryMuscles: ['quads', 'glutes'], usageCount: 236 })).toBe('Quads · Glutes · 236×');
    expect(exerciseSubtitle({ primaryMuscles: ['side-delt'], usageCount: 0 })).toBe('Side delts');
    expect(exerciseSubtitle({ primaryMuscles: [], usageCount: 1200 })).toBe('1,200×');
  });

  test('Usage reads sessions then sets, singular for one', () => {
    expect(usageText(236, 1402)).toBe('236 sessions · 1,402 sets');
    expect(usageText(1, 1)).toBe('1 session · 1 set');
  });

  test('A top set shows its load in the unit it was typed in', () => {
    expect(topSetText({ weightKilograms: 61.23496, entryUnit: 'lb', reps: 8 })).toBe('135 lb × 8');
    expect(topSetText({ weightKilograms: 102.5, entryUnit: 'kg', reps: 5 })).toBe('102.5 kg × 5');
  });

  test('A bodyweight top set says Bodyweight and a warm-up-only session says so', () => {
    expect(topSetText({ weightKilograms: 0, entryUnit: 'kg', reps: 12 })).toBe('Bodyweight × 12');
    expect(topSetText(null)).toBe('Warm-ups only');
  });

  test('Traits skip what is unset', () => {
    expect(
      exerciseTraitsText({
        equipment: 'dumbbell',
        movementPattern: 'shoulder-abduction',
        mechanic: 'isolation',
        isLengthenedBiased: true,
      }),
    ).toBe('Dumbbell · Lateral raise · Isolation · Long-length bias');
    expect(
      exerciseTraitsText({ equipment: null, movementPattern: null, mechanic: null, isLengthenedBiased: false }),
    ).toBe('');
  });
});
