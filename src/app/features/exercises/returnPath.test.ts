import { describe, expect, test } from 'vitest';
import { editExercisePath, safeReturnPath } from './returnPath';

describe('return path', () => {
  test('Only paths inside the app are accepted', () => {
    expect(safeReturnPath('/settings/matching')).toBe('/settings/matching');
    expect(safeReturnPath(null)).toBeUndefined();
    expect(safeReturnPath('https://example.com')).toBeUndefined();
    expect(safeReturnPath('//example.com')).toBeUndefined();
  });

  test('The edit path carries where to return to', () => {
    expect(editExercisePath(7)).toBe('/exercises/7/edit');
    expect(editExercisePath(7, '/settings/matching')).toBe('/exercises/7/edit?next=%2Fsettings%2Fmatching');
  });
});
