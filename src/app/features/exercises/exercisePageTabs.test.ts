import { expect, test } from 'vitest';
import { exercisePageTab, exercisePageTabParams, exercisePageTabs } from './exercisePageTabs';

test('each tab round-trips in the URL without losing unrelated query context', () => {
  const original = new URLSearchParams('search=synthetic&next=%2Fworkout');
  for (const tab of exercisePageTabs) {
    const next = exercisePageTabParams(original, tab.value);
    expect(exercisePageTab(new URLSearchParams(next.toString()))).toBe(tab.value);
    expect(next.get('search')).toBe('synthetic');
    expect(next.get('next')).toBe('/workout');
  }
  expect(original.has('tab')).toBe(false);
});

test('absent, unknown and differently cased tabs fall back to Summary', () => {
  for (const value of ['', 'tab=unknown', 'tab=Charts'])
    expect(exercisePageTab(new URLSearchParams(value))).toBe('summary');
});
