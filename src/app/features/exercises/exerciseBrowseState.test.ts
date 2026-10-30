import { describe, expect, test } from 'vitest';
import {
  EMPTY_BROWSE_STATE,
  isSearching,
  rememberBrowseState,
  rememberedBrowseState,
  searchFilterOf,
} from './exerciseBrowseState';

describe('exercise browse state', () => {
  test('The list is remembered for the next visit', () => {
    expect(rememberedBrowseState()).toEqual(EMPTY_BROWSE_STATE);
    const state = {
      query: 'lateral rasie',
      muscle: 'side-delt',
      equipment: undefined,
      mechanic: undefined,
      customOnly: false,
    } as const;
    rememberBrowseState(state);
    expect(rememberedBrowseState()).toEqual(state);
    rememberBrowseState(EMPTY_BROWSE_STATE);
  });

  test('The filter leaves out what is not chosen', () => {
    expect(searchFilterOf(EMPTY_BROWSE_STATE)).toEqual({});
    expect(searchFilterOf({ ...EMPTY_BROWSE_STATE, muscle: 'chest', customOnly: true })).toEqual({
      muscle: 'chest',
      customOnly: true,
    });
  });

  test('Whitespace alone is not a search; a filter is', () => {
    expect(isSearching({ ...EMPTY_BROWSE_STATE, query: '   ' })).toBe(false);
    expect(isSearching({ ...EMPTY_BROWSE_STATE, query: 'rdl' })).toBe(true);
    expect(isSearching({ ...EMPTY_BROWSE_STATE, equipment: 'cable' })).toBe(true);
    expect(isSearching({ ...EMPTY_BROWSE_STATE, customOnly: true })).toBe(true);
    expect(isSearching({ ...EMPTY_BROWSE_STATE, mechanic: 'isolation' })).toBe(true);
    expect(searchFilterOf({ ...EMPTY_BROWSE_STATE, mechanic: 'compound' })).toEqual({ mechanic: 'compound' });
  });
});
