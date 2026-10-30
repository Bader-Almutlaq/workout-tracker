import { EQUIPMENT_DISPLAY_NAMES, type Equipment } from './Equipment';
import type { Muscle } from './Muscle';
import { SearchText } from './SearchText';

/** One searchable exercise: the library or custom exercise as it exists in the database. */
export interface ExerciseSearchEntry {
  /** Database row id of the exercise. */
  readonly id: number;
  /** Display name, e.g. "Lateral Raise (Dumbbell)". */
  readonly name: string;
  /** Other names and slang that should also find this exercise. */
  readonly aliases: readonly string[];
  /** What it is performed with; `null` for custom exercises without equipment. */
  readonly equipment: Equipment | null;
  /** Prime movers. `ExerciseSearchFilter.muscle` matches these only. */
  readonly primaryMuscles: readonly Muscle[];
  /** Synergists; shown but not filtered on. */
  readonly secondaryMuscles: readonly Muscle[];
  /** True for exercises the user created. */
  readonly isCustom: boolean;
  /** Number of workouts the exercise appears in; drives ordering of otherwise equal matches. */
  readonly usageCount: number;
  /** When it was last logged; `null` if never. */
  readonly lastUsedAt: Date | null;
}

/** Narrows a search to part of the library. An empty object lets everything through. */
export interface ExerciseSearchFilter {
  /** Keeps entries whose PRIMARY muscles include this one. */
  readonly muscle?: Muscle;
  /** Keeps entries performed with this equipment. */
  readonly equipment?: Equipment;
  /** Keeps only user-created exercises when true. */
  readonly customOnly?: boolean;
}

/**
 * How well a query token matched a field token: a typo, a prefix, or the whole word.
 * `SearchTuning` gives the score of each in strict mode and the weight in soft mode.
 */
type MatchKind = 'fuzzy' | 'prefix' | 'exact';

/** Milliseconds in one day, to turn `SearchTuning.recencyWindowDays` into a time difference. */
const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Every score and threshold in one place. All are heuristics tuned by hand against the bundled
 * library (see `ExerciseSearch.test.ts`); no published source applies.
 */
export const SearchTuning = {
  /** Heuristic: query tokens shorter than this only match whole words ("a" must not match everything). */
  minimumPrefixLength: 2,
  /** Heuristic: shortest query token that tolerates a typo; shorter words differ too easily ("bar" vs "bat"). */
  minimumFuzzyLength: 4,
  /** Heuristic: longest query token that still allows only one typo. */
  singleTypoMaximumLength: 7,
  /** Heuristic: typos allowed in a token up to `singleTypoMaximumLength` letters. */
  shortTokenTypos: 1,
  /** Heuristic: typos allowed in longer tokens. */
  longTokenTypos: 2,
  /** Heuristic: a multi-word query must have at least this many letters once joined to match inside a name ("pull down" in "pulldown"). */
  minimumSubstringLength: 4,

  /** Heuristic: strict-mode score of one query token that matches a field token within the typo allowance. */
  fuzzyMatchScore: 10,
  /** Heuristic: strict-mode score of one query token that is the start of a field token. */
  prefixMatchScore: 20,
  /** Heuristic: strict-mode score of one query token that equals a field token. */
  exactMatchScore: 30,
  /** Heuristic: field whose whole text equals the query; large enough to beat every other term. */
  exactNameBonus: 1000,
  /** Heuristic: name beginning with the query words, last one possibly partial ("lat pull" for "Lat Pulldown"). */
  namePrefixBonus: 500,
  /** Heuristic: alias equal to the query; below a name hit because aliases are shared by sibling variants. */
  exactAliasBonus: 300,
  /** Heuristic: alias beginning with the query. */
  aliasPrefixBonus: 150,
  /** Heuristic: any match on the name beats an alias-only match; roughly the value of a name starting with the query's first word. */
  nameMatchBonus: 200,
  /** Heuristic: score of a match found only by removing separators ("pull down" for "Pulldown"); about one fuzzy token. */
  substringMatchScore: 15,
  /** Heuristic: points lost per word of the field the query did not mention, so "Lateral Raise (Dumbbell)" beats "Seated Lateral Raise (Dumbbell)". */
  unmatchedTokenPenalty: 3,
  /** Heuristic: points per doubling of `usageCount + 1`; 100 uses is worth about 27 points, enough to reorder siblings but not to beat a better word match. */
  usageScale: 4,
  /** Heuristic: bonus for an exercise used within `recencyWindowDays`. */
  recencyBonus: 6,
  /** Heuristic: how recent counts as "recently used", in days. */
  recencyWindowDays: 30,

  /** Heuristic: soft-mode weight of an exact word. */
  exactSuggestionWeight: 1,
  /** Heuristic: soft-mode weight of a word that only starts like the entry's ("under" for "underhand"). */
  prefixSuggestionWeight: 0.9,
  /** Heuristic: soft-mode weight of a typo match. */
  fuzzySuggestionWeight: 0.8,
  /**
   * Heuristic: multiplier on a suggestion matched through an alias, so that a name matching equally
   * well wins ("high to low crossover" must not outrank a real "Low to High Cable Crossover").
   */
  aliasSuggestionFactor: 0.95,
  /** Heuristic: suggestions scoring below this are noise; a single shared word out of six words per side scores about 0.17, two out of five about 0.4. */
  minimumSuggestionScore: 0.34,
} as const;

/** Strict-mode score of one query token by how it matched. */
const STRICT_SCORE: Readonly<Record<MatchKind, number>> = {
  fuzzy: SearchTuning.fuzzyMatchScore,
  prefix: SearchTuning.prefixMatchScore,
  exact: SearchTuning.exactMatchScore,
};

/** Share of a token a suggestion match is worth, so an exact word beats a prefix or a typo. */
const SUGGESTION_WEIGHT: Readonly<Record<MatchKind, number>> = {
  fuzzy: SearchTuning.fuzzySuggestionWeight,
  prefix: SearchTuning.prefixSuggestionWeight,
  exact: SearchTuning.exactSuggestionWeight,
};

/**
 * Searchable text of one name or alias: tokens plus the equipment words, so an alias such as
 * "palms up wrist curl" still matches a query that adds "dumbbell".
 */
interface Field {
  /** Tokens of the text itself followed by any equipment tokens it lacks. */
  readonly tokens: readonly string[];
  /** How many leading `tokens` came from the text itself. */
  readonly ownTokenCount: number;
  /** `tokens` concatenated, for matching across a space ("pull down"). */
  readonly joined: string;
  /** Only the text's own tokens concatenated, for exact equality ignoring spaces. */
  readonly ownJoined: string;
  readonly isName: boolean;
}

interface Indexed {
  readonly entry: ExerciseSearchEntry;
  readonly fields: readonly Field[];
  /** Length of the display name in code points, the first tie-breaker. */
  readonly nameLength: number;
}

interface Scored {
  readonly indexed: Indexed;
  readonly score: number;
}

/** Compares names ignoring case but not accents, like Foundation's `localizedCaseInsensitiveCompare`. */
const NAME_COLLATOR = new Intl.Collator('en', { sensitivity: 'accent' });

function makeField(text: string, equipmentTokens: readonly string[], isName: boolean): Field {
  const own = SearchText.tokens(text);
  const tokens = [...own, ...equipmentTokens.filter((token) => !own.includes(token))];
  return { tokens, ownTokenCount: own.length, joined: tokens.join(''), ownJoined: own.join(''), isName };
}

function entryAllowedBy(entry: ExerciseSearchEntry, filter: ExerciseSearchFilter): boolean {
  if (filter.muscle !== undefined && !entry.primaryMuscles.includes(filter.muscle)) return false;
  if (filter.equipment !== undefined && entry.equipment !== filter.equipment) return false;
  if (filter.customOnly === true && !entry.isCustom) return false;
  return true;
}

function sameTokens(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((token, index) => token === right[index]);
}

/**
 * How `queryToken` matches `fieldToken`: equal, prefix of it, or within the typo allowance of the
 * whole token or of its prefix of the same length ("bayseian" ~ "bayesian", "latteral" ~ "lateral").
 */
function matchKindOf(queryToken: string, fieldToken: string): MatchKind | null {
  if (queryToken === fieldToken) return 'exact';
  const length = [...queryToken].length;
  if (length >= SearchTuning.minimumPrefixLength && fieldToken.startsWith(queryToken)) return 'prefix';
  if (length < SearchTuning.minimumFuzzyLength) return null;
  const limit =
    length <= SearchTuning.singleTypoMaximumLength ? SearchTuning.shortTokenTypos : SearchTuning.longTokenTypos;
  if (SearchText.editDistance(queryToken, fieldToken, limit) !== null) return 'fuzzy';
  if (
    [...fieldToken].length > length &&
    SearchText.editDistance(queryToken, [...fieldToken].slice(0, length).join(''), limit) !== null
  ) {
    return 'fuzzy';
  }
  return null;
}

/** The strongest way `queryToken` matches any of `fieldTokens`, or `null`. */
function bestMatchOf(queryToken: string, fieldTokens: readonly string[]): MatchKind | null {
  let best: MatchKind | null = null;
  for (const fieldToken of fieldTokens) {
    const kind = matchKindOf(queryToken, fieldToken);
    if (kind === null) continue;
    if (kind === 'exact') return 'exact';
    if (best !== null && STRICT_SCORE[best] >= STRICT_SCORE[kind]) continue;
    best = kind;
  }
  return best;
}

/** True when the field's own tokens begin with the query tokens, the last one possibly partial. */
function fieldStartsWith(field: Field, queryTokens: readonly string[]): boolean {
  if (queryTokens.length > field.ownTokenCount) return false;
  for (const [index, token] of queryTokens.entries()) {
    const fieldToken = field.tokens[index];
    if (fieldToken === undefined) return false;
    const isLast = index === queryTokens.length - 1;
    if (isLast ? !fieldToken.startsWith(token) : fieldToken !== token) return false;
  }
  return true;
}

/** Relevance of one field to the query, or `null` when the field does not match. */
function fieldScore(field: Field, queryTokens: readonly string[], queryJoined: string): number | null {
  let score = 0;
  let everyTokenMatched = true;
  for (const token of queryTokens) {
    const kind = bestMatchOf(token, field.tokens);
    if (kind === null) {
      everyTokenMatched = false;
      break;
    }
    score += STRICT_SCORE[kind];
  }
  if (!everyTokenMatched) {
    if (
      queryTokens.length <= 1 ||
      [...queryJoined].length < SearchTuning.minimumSubstringLength ||
      !field.joined.includes(queryJoined)
    ) {
      return null;
    }
    score = SearchTuning.substringMatchScore;
  }

  const ownTokens = field.tokens.slice(0, field.ownTokenCount);
  if (sameTokens(ownTokens, queryTokens) || field.ownJoined === queryJoined) {
    score += field.isName ? SearchTuning.exactNameBonus : SearchTuning.exactAliasBonus;
  } else if (fieldStartsWith(field, queryTokens)) {
    score += field.isName ? SearchTuning.namePrefixBonus : SearchTuning.aliasPrefixBonus;
  }
  if (field.isName) score += SearchTuning.nameMatchBonus;
  const unmatched = Math.max(0, field.ownTokenCount - queryTokens.length);
  return score - unmatched * SearchTuning.unmatchedTokenPenalty;
}

function popularityScore(entry: ExerciseSearchEntry, now: Date): number {
  let score = SearchTuning.usageScale * Math.log2(1 + Math.max(0, entry.usageCount));
  if (
    entry.lastUsedAt !== null &&
    now.getTime() - entry.lastUsedAt.getTime() <= SearchTuning.recencyWindowDays * MILLISECONDS_PER_DAY
  ) {
    score += SearchTuning.recencyBonus;
  }
  return score;
}

/** Orders by score (high first), then shorter name, then alphabetically ignoring case. */
function compareScored(left: Scored, right: Scored): number {
  if (left.score !== right.score) return right.score - left.score;
  if (left.indexed.nameLength !== right.indexed.nameLength) return left.indexed.nameLength - right.indexed.nameLength;
  return NAME_COLLATOR.compare(left.indexed.entry.name, right.indexed.entry.name);
}

/** The first run of two unused adjacent field tokens whose concatenation is `token`, or `undefined`. */
function joinedFieldSlot(fieldTokens: readonly string[], used: readonly boolean[], token: string): number | undefined {
  for (let slot = 0; slot + 1 < fieldTokens.length; slot += 1) {
    if (
      used[slot] !== true &&
      used[slot + 1] !== true &&
      `${fieldTokens[slot] ?? ''}${fieldTokens[slot + 1] ?? ''}` === token
    ) {
      return slot;
    }
  }
  return undefined;
}

/** Dice coverage in 0...1 of `queryTokens` by `fieldTokens`; each field token is used at most once. */
function coverage(queryTokens: readonly string[], fieldTokens: readonly string[]): number {
  const used: boolean[] = fieldTokens.map(() => false);
  let queryCredit = 0;
  let fieldCredit = 0;
  let index = 0;
  while (index < queryTokens.length) {
    const token = queryTokens[index] ?? '';
    const next = queryTokens[index + 1];
    if (next !== undefined) {
      const pair = token + next;
      const pairSlot = fieldTokens.findIndex((fieldToken, slot) => used[slot] !== true && fieldToken === pair);
      if (pairSlot >= 0) {
        used[pairSlot] = true;
        queryCredit += 2;
        fieldCredit += 1;
        index += 2;
        continue;
      }
    }
    index += 1;

    let best: { readonly slot: number; readonly kind: MatchKind } | null = null;
    for (const [slot, fieldToken] of fieldTokens.entries()) {
      if (used[slot] === true) continue;
      const kind = matchKindOf(token, fieldToken);
      if (kind === null) continue;
      if (best !== null && STRICT_SCORE[best.kind] >= STRICT_SCORE[kind]) continue;
      best = { slot, kind };
    }
    const joinedSlot = best?.kind === 'exact' ? undefined : joinedFieldSlot(fieldTokens, used, token);
    if (joinedSlot !== undefined) {
      used[joinedSlot] = true;
      used[joinedSlot + 1] = true;
      queryCredit += 1;
      fieldCredit += 2;
    } else if (best !== null) {
      used[best.slot] = true;
      queryCredit += SUGGESTION_WEIGHT[best.kind];
      fieldCredit += SUGGESTION_WEIGHT[best.kind];
    }
  }
  return (queryCredit + fieldCredit) / (queryTokens.length + fieldTokens.length);
}

/**
 * In-memory exercise search over the whole library plus the user's custom exercises.
 *
 * About 600 entries are indexed once; `results` runs on every keystroke and `suggestions` maps
 * imported names to the closest entries. Everything is normalised with `SearchText`, so slang
 * ("rdl", "db"), plurals and minor typos are handled identically for queries, names and aliases.
 * The clock is never read here: callers pass `now`.
 */
export class ExerciseSearch {
  private readonly indexed: readonly Indexed[];

  /** Indexes `entries` (normalising names and aliases once) for fast repeated searches. */
  constructor(entries: readonly ExerciseSearchEntry[]) {
    this.indexed = entries.map((entry) => {
      // Bodyweight has no word in the name, so adding one would only dilute matches.
      const equipmentTokens =
        entry.equipment === null || entry.equipment === 'bodyweight'
          ? []
          : SearchText.tokens(EQUIPMENT_DISPLAY_NAMES[entry.equipment]);
      const fields = [
        makeField(entry.name, equipmentTokens, true),
        ...entry.aliases.map((alias) => makeField(alias, equipmentTokens, false)),
      ];
      return { entry, fields, nameLength: [...entry.name].length };
    });
  }

  /**
   * Entries matching `query`, best first, for the search box.
   *
   * An empty query returns every entry passing `filter`, most used first, then by name.
   * Otherwise an entry matches when every query token matches a token of its name, or every query
   * token matches a token of one alias (see `SearchText` for normalisation). A query token matches
   * by equality, by prefix (tokens of two or more letters), or within one typo (four or more
   * letters) or two typos (eight or more), including a typo in the first letters of a longer word.
   * A multi-word query also matches when its words, joined, appear inside the joined name
   * ("pull down" finds "Pulldown").
   *
   * Ranking: exact name, then name starting with the query, then name over alias matches, then
   * exact over prefix over typo matches, then a boost for usage count and recent use (`now`
   * decides what is recent). Ties go to the shorter name, then alphabetical order.
   *
   * @param filter Use `{}` for no filter.
   * @param now The current time, passed in so core never reads the clock.
   */
  results(query: string, filter: ExerciseSearchFilter, now: Date): ExerciseSearchEntry[] {
    const candidates = this.indexed.filter((candidate) => entryAllowedBy(candidate.entry, filter));
    const queryTokens = SearchText.tokens(query);
    if (queryTokens.length === 0) {
      return candidates
        .map((candidate) => candidate.entry)
        .sort((left, right) =>
          left.usageCount !== right.usageCount
            ? right.usageCount - left.usageCount
            : NAME_COLLATOR.compare(left.name, right.name),
        );
    }

    const queryJoined = queryTokens.join('');
    const scored: Scored[] = [];
    for (const candidate of candidates) {
      let relevance: number | null = null;
      for (const field of candidate.fields) {
        const score = fieldScore(field, queryTokens, queryJoined);
        if (score !== null && (relevance === null || score > relevance)) relevance = score;
      }
      if (relevance !== null)
        scored.push({ indexed: candidate, score: relevance + popularityScore(candidate.entry, now) });
    }
    return scored.sort(compareScored).map((item) => item.indexed.entry);
  }

  /**
   * The entries closest to an imported exercise name, best first, at most `limit`.
   *
   * For names that do not match any entry exactly, such as "Low To High Single Arm Cable Cross
   * Over". Not every word has to match. The score is Dice-style coverage:
   * (query words matched + entry words matched) / (query words + entry words), with a prefix match
   * worth 0.9 of a word and a typo match 0.8. Adjacent query words may be joined to match one entry
   * word ("cross" + "over" = "crossover") and the reverse. The best of the name and each alias
   * counts (an alias match is worth 0.95 of the same match on the name), and the equipment word
   * counts like any other. Entries scoring below 0.34 are not returned.
   */
  suggestions(name: string, limit = 3): ExerciseSearchEntry[] {
    const queryTokens = SearchText.tokens(name);
    if (queryTokens.length === 0 || limit <= 0) return [];
    const scored: Scored[] = [];
    for (const candidate of this.indexed) {
      let score = 0;
      for (const field of candidate.fields) {
        const fieldCoverage =
          coverage(queryTokens, field.tokens) * (field.isName ? 1 : SearchTuning.aliasSuggestionFactor);
        score = Math.max(score, fieldCoverage);
      }
      if (score >= SearchTuning.minimumSuggestionScore) scored.push({ indexed: candidate, score });
    }
    return scored
      .sort(compareScored)
      .slice(0, limit)
      .map((item) => item.indexed.entry);
  }
}
