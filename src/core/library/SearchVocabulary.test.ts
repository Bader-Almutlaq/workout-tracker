import { describe, expect, test } from 'vitest';
import { SearchText } from './SearchText';
import { SearchVocabulary } from './SearchVocabulary';

describe('SearchVocabulary', () => {
  test('normalizes common gym terms to the intended constraints', () => {
    for (const [word, kind] of [
      ['pecs', 'muscle'],
      ['rear delts', 'muscle'],
      ['bis', 'muscle'],
      ['calves', 'muscle'],
      ['plate loaded', 'equipment'],
      ['db', 'equipment'],
      ['isolation', 'mechanic'],
      ['curl', 'pattern'],
    ]) {
      expect(SearchVocabulary[SearchText.tokens(word ?? '').join(' ')]?.kind).toBe(kind);
    }
  });
});
