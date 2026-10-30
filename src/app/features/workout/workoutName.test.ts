import { describe, expect, test } from 'vitest';
import { workoutNameAt } from './workoutName';

describe('workout name', () => {
  test('Before noon it is a morning workout', () => {
    expect(workoutNameAt(new Date(2026, 9, 30, 0, 5))).toBe('Morning workout');
    expect(workoutNameAt(new Date(2026, 9, 30, 11, 59))).toBe('Morning workout');
  });

  test('From noon to before five it is an afternoon workout', () => {
    expect(workoutNameAt(new Date(2026, 9, 30, 12, 0))).toBe('Afternoon workout');
    expect(workoutNameAt(new Date(2026, 9, 30, 16, 59))).toBe('Afternoon workout');
  });

  test('From five it is an evening workout', () => {
    expect(workoutNameAt(new Date(2026, 9, 30, 17, 0))).toBe('Evening workout');
    expect(workoutNameAt(new Date(2026, 9, 30, 23, 59))).toBe('Evening workout');
  });
});
