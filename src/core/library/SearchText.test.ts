import { describe, expect, test } from 'vitest';
import { GymSlang } from './GymSlang';
import { SearchText } from './SearchText';

describe('SearchText.tokens', () => {
  test('lowercases, folds accents and splits on punctuation', () => {
    expect(SearchText.tokens('Triceps Pushdown (Cable - Rope)')).toEqual(['tricep', 'pushdown', 'cable', 'rope']);
    expect(SearchText.tokens('Café-Curl_2x')).toEqual(['cafe', 'curl', '2x']);
    expect(SearchText.tokens('  ,.- ')).toEqual([]);
    expect(SearchText.tokens('')).toEqual([]);
  });

  test('apostrophes join instead of splitting', () => {
    expect(SearchText.tokens("Farmer's Walk")).toEqual(['farmer', 'walk']);
    expect(SearchText.tokens('Farmer’s Walk')).toEqual(['farmer', 'walk']);
    expect(SearchText.tokens('farmers walk')).toEqual(['farmer', 'walk']);
  });

  test('singularises one trailing s, only on long tokens', () => {
    expect(SearchText.tokens('raises')).toEqual(['raise']);
    expect(SearchText.tokens('triceps biceps lats')).toEqual(['tricep', 'bicep', 'lat']);
    expect(SearchText.tokens('press')).toEqual(['press']);
    expect(SearchText.tokens('abs')).toEqual(['abs']);
    expect(SearchText.tokens('cross')).toEqual(['cross']);
    expect(SearchText.tokens('dips')).toEqual(['dip']);
  });

  test('expands slang into several tokens', () => {
    expect(SearchText.tokens('RDL')).toEqual(['romanian', 'deadlift']);
    expect(SearchText.tokens('db row')).toEqual(['dumbbell', 'row']);
    expect(SearchText.tokens('OHP')).toEqual(['overhead', 'press']);
    expect(SearchText.tokens('pullups')).toEqual(['pull', 'up']);
    expect(SearchText.tokens('tris')).toEqual(['tricep']);
    expect(SearchText.tokens('delts')).toEqual(['delt']);
  });

  test('lat is not expanded because it is ambiguous', () => {
    expect(SearchText.tokens('lat')).toEqual(['lat']);
  });

  test('a query and a name normalise identically', () => {
    expect(SearchText.tokens('Lateral Raise (Dumbbell)')).toEqual(SearchText.tokens('lateral raises db'));
  });

  test('words that name inherited object properties are ordinary words', () => {
    expect(SearchText.tokens('constructor')).toEqual(['constructor']);
    expect(SearchText.tokens('toString')).toEqual(['tostring']);
  });
});

describe('GymSlang', () => {
  test('every slang key and value is non-empty lowercase', () => {
    for (const [key, words] of GymSlang.expansions) {
      expect(key).toBe(key.toLowerCase());
      expect(words.length).toBeGreaterThan(0);
      for (const word of words) {
        expect(word).toBe(word.toLowerCase());
        expect(word).not.toBe('');
      }
    }
  });
});

describe('SearchText.editDistance', () => {
  test('counts edits and transpositions', () => {
    expect(SearchText.editDistance('curl', 'curl', 2)).toBe(0);
    expect(SearchText.editDistance('curl', 'curls', 2)).toBe(1);
    expect(SearchText.editDistance('curl', 'crul', 2)).toBe(1);
    expect(SearchText.editDistance('bayseian', 'bayesian', 2)).toBe(1);
    expect(SearchText.editDistance('latteral', 'lateral', 2)).toBe(1);
    expect(SearchText.editDistance('kitten', 'sitting', 3)).toBe(3);
  });

  test('returns null beyond the limit', () => {
    expect(SearchText.editDistance('kitten', 'sitting', 2)).toBeNull();
    expect(SearchText.editDistance('row', 'squat', 1)).toBeNull();
    expect(SearchText.editDistance('a', 'abcd', 2)).toBeNull();
    expect(SearchText.editDistance('curl', 'curl', -1)).toBeNull();
  });

  test('handles empty strings', () => {
    expect(SearchText.editDistance('', '', 1)).toBe(0);
    expect(SearchText.editDistance('', 'ab', 2)).toBe(2);
    expect(SearchText.editDistance('ab', '', 1)).toBeNull();
  });
});

describe('SearchText.words', () => {
  test('folds accents and splits on every non-alphanumeric run, apostrophes included', () => {
    expect(SearchText.words("Farmer's Walk (Café)")).toEqual(['farmer', 's', 'walk', 'cafe']);
  });
});
