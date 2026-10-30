import { GymSlang } from './GymSlang';

/** Fixed parameters of the `SearchText` normalisation rules. */
export const SearchTextRules = {
  /** A token must be longer than this to lose a trailing "s", so "abs" and "ups" stay whole. */
  maximumLengthKeptPlural: 3,
} as const;

/** Marks that combine with a base letter ("é" is "e" plus U+0301), removed after decomposition. */
const COMBINING_MARKS = /\p{M}/gu;

/**
 * Characters dropped without splitting the word, so "farmer's" becomes "farmers" instead of the
 * stray one-letter token "s": the ASCII apostrophe and the typographic right single quote.
 */
const JOINING_CHARACTERS = /['’]/gu;

/** Any run of characters that is neither a letter nor a digit; separates words. */
const SEPARATORS = /[^\p{L}\p{N}]+/u;

/**
 * Lowercases `text`, removes accents and splits it into words at every run of characters that is
 * not a letter or digit: "Café-Curl_2x" gives "cafe", "curl", "2x". No slang or plural handling.
 */
function words(text: string): string[] {
  const folded = text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
  return folded.split(SEPARATORS).filter((word) => word !== '');
}

/**
 * Drops one trailing "s" from tokens longer than three letters that do not end in "ss":
 * "raises" → "raise", "triceps" → "tricep", but "press" and "abs" are unchanged.
 */
function singularised(token: string): string {
  if (
    [...token].length <= SearchTextRules.maximumLengthKeptPlural ||
    !token.endsWith('s') ||
    token.endsWith('ss')
  ) {
    return token;
  }
  return token.slice(0, -1);
}

/**
 * Splits `text` into lowercase, accent-free word tokens.
 *
 * Steps: fold case and accents; treat every character that is not a letter or digit as a
 * separator (apostrophes are dropped instead); expand gym slang via `GymSlang` (one token may
 * become several); then singularise. Empty or all-punctuation text gives no tokens.
 *
 * @returns Tokens in reading order, duplicates kept.
 */
function tokens(text: string): string[] {
  return words(text.replace(JOINING_CHARACTERS, ''))
    .flatMap((word) => GymSlang.expansions.get(word) ?? [word])
    .map(singularised);
}

/** Reads a matrix row cell; the row is always long enough, so the fallback never applies. */
function cell(row: readonly number[], index: number): number {
  return row[index] ?? 0;
}

/**
 * Optimal-string-alignment distance between `a` and `b`: the fewest single-character insertions,
 * deletions, substitutions and adjacent transpositions that turn one into the other. Characters
 * are compared as Unicode code points.
 *
 * Cheap by design for per-keystroke use: returns `null` as soon as the distance is certain to
 * exceed `limit` (length difference, or every cell of two consecutive rows over the limit).
 *
 * @param limit Largest distance worth reporting; negative values never match.
 * @returns The distance, or `null` when it is greater than `limit`.
 */
function editDistance(a: string, b: string, limit: number): number | null {
  if (limit < 0) return null;
  const left = Array.from(a);
  const right = Array.from(b);
  if (Math.abs(left.length - right.length) > limit) return null;
  if (left.length === 0 || right.length === 0) {
    const distance = Math.max(left.length, right.length);
    return distance <= limit ? distance : null;
  }

  let beforePrevious: number[] = new Array<number>(right.length + 1).fill(0);
  let previous: number[] = Array.from({ length: right.length + 1 }, (_, column) => column);
  let current: number[] = new Array<number>(right.length + 1).fill(0);
  let previousRowMinimum = 0;
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    let rowMinimum = i;
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      let value = Math.min(
        cell(previous, j) + 1,
        cell(current, j - 1) + 1,
        cell(previous, j - 1) + substitutionCost,
      );
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        value = Math.min(value, cell(beforePrevious, j - 2) + 1);
      }
      current[j] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }
    // A transposition reads two rows back, so one bad row is not yet proof.
    if (Math.min(rowMinimum, previousRowMinimum) > limit) return null;
    previousRowMinimum = rowMinimum;
    [beforePrevious, previous, current] = [previous, current, beforePrevious];
  }
  const distance = cell(previous, right.length);
  return distance <= limit ? distance : null;
}

/**
 * Text normalisation shared by every exercise search and by library keys, so a query and an
 * exercise name are always reduced to comparable tokens the same way.
 */
export const SearchText = { words, tokens, singularised, editDistance } as const;
