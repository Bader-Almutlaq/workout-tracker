import { describe, expect, test } from 'vitest';
import { toKilograms } from '../../../core/units/Weight';
import { cellStartText, cellText, isCellEmpty, previousText } from './setCellText';
import { makeSet } from './workoutTestData';

const lbSet = makeSet({ weightKilograms: toKilograms(135, 'lb'), entryUnit: 'lb', reps: 8, rpe: 8.5 });

describe('set cell text', () => {
  test('The weight cell shows the number in the unit the set was typed in', () => {
    expect(cellText(lbSet, 'weight', 'weight-reps')).toBe('135');
    expect(cellText(makeSet({ weightKilograms: 102.5 }), 'weight', 'weight-reps')).toBe('102.5');
  });

  test('An unloaded bodyweight set reads BW and a loaded one shows the added weight', () => {
    expect(cellText(makeSet({ weightKilograms: 0 }), 'weight', 'bodyweight-reps')).toBe('BW');
    expect(cellText(makeSet({ weightKilograms: 10 }), 'weight', 'bodyweight-reps')).toBe('10');
    expect(isCellEmpty(makeSet({ weightKilograms: 0 }), 'weight', 'bodyweight-reps')).toBe(false);
    expect(isCellEmpty(makeSet({ weightKilograms: 0 }), 'weight', 'weight-reps')).toBe(true);
  });

  test('The reps cell shows reps, or seconds as m:ss for timed exercises', () => {
    expect(cellText(lbSet, 'reps', 'weight-reps')).toBe('8');
    expect(cellText(makeSet({ reps: 0, durationSeconds: 90 }), 'reps', 'duration')).toBe('1:30');
    expect(cellText(makeSet({ reps: 0, durationSeconds: null }), 'reps', 'weight-duration')).toBe('0:00');
  });

  test('The RPE cell shows the rating or a dash', () => {
    expect(cellText(lbSet, 'rpe', 'weight-reps')).toBe('8.5');
    expect(cellText(makeSet({ rpe: null }), 'rpe', 'weight-reps')).toBe('—');
    expect(isCellEmpty(makeSet({ rpe: null }), 'rpe', 'weight-reps')).toBe(true);
  });

  test('Cells start empty when the value is zero or unset', () => {
    const blank = makeSet({ weightKilograms: 0, reps: 0, rpe: null });
    expect(cellStartText(blank, 'weight', 'weight-reps')).toBe('');
    expect(cellStartText(blank, 'reps', 'weight-reps')).toBe('');
    expect(cellStartText(blank, 'rpe', 'weight-reps')).toBe('');
  });

  test('Cells start with the saved value in the unit it was typed in', () => {
    expect(cellStartText(lbSet, 'weight', 'weight-reps')).toBe('135');
    expect(cellStartText(lbSet, 'reps', 'weight-reps')).toBe('8');
    expect(cellStartText(lbSet, 'rpe', 'weight-reps')).toBe('8.5');
    expect(cellStartText(makeSet({ reps: 0, durationSeconds: 45 }), 'reps', 'duration')).toBe('45');
  });

  test('Previous shows weight and reps in the row unit', () => {
    expect(previousText(lbSet, 'weight-reps', 'lb')).toBe('135 lb × 8');
    expect(previousText(makeSet({ weightKilograms: 60 }), 'weight-reps', 'kg')).toBe('60 kg × 8');
  });

  test('Previous follows the tracking kind', () => {
    expect(previousText(makeSet({ weightKilograms: 0, reps: 12 }), 'bodyweight-reps', 'kg')).toBe('BW × 12');
    expect(previousText(makeSet({ weightKilograms: 10, reps: 12 }), 'bodyweight-reps', 'kg')).toBe('+10 kg × 12');
    expect(previousText(makeSet({ reps: 0, durationSeconds: 90 }), 'duration', 'kg')).toBe('1:30');
    expect(previousText(makeSet({ weightKilograms: 20, reps: 0, durationSeconds: 90 }), 'weight-duration', 'kg')).toBe(
      '20 kg × 1:30',
    );
  });
});
