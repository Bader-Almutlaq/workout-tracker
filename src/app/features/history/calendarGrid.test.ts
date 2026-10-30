import { describe, expect, test } from 'vitest';
import { calendarGrid } from './calendarGrid';

describe('calendarGrid', () => {
  test('starts on Monday and leaves outside days blank', () => {
    const grid = calendarGrid(2026, 10);
    expect(grid[0]).toEqual([null, null, null, 1, 2, 3, 4]);
    expect(grid[4]).toEqual([26, 27, 28, 29, 30, 31, null]);
  });
  test('handles leap years and months requiring six weeks', () => {
    expect(
      calendarGrid(2024, 2)
        .flat()
        .filter((day) => day !== null),
    ).toHaveLength(29);
    expect(calendarGrid(2021, 5)).toHaveLength(6);
    expect(calendarGrid(2021, 2)).toHaveLength(4);
  });
});
