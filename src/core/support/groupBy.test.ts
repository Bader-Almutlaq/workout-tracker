import { describe, expect, test } from 'vitest';
import { groupBy } from './groupBy';

describe('groupBy', () => {
  test('groups and items keep first-appearance order', () => {
    const groups = groupBy(['b1', 'a1', 'b2', 'c1', 'a2'], (item) => item.slice(0, 1));
    expect([...groups.keys()]).toEqual(['b', 'a', 'c']);
    expect(groups.get('b')).toEqual(['b1', 'b2']);
    expect(groups.get('a')).toEqual(['a1', 'a2']);
  });

  test('no items gives no groups', () => {
    expect(groupBy([], (item: string) => item).size).toBe(0);
  });
});
