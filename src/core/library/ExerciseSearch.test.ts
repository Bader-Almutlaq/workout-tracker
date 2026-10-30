import { describe, expect, test } from 'vitest';
import type { Equipment } from './Equipment';
import { ExerciseLibrary } from './ExerciseLibrary';
import { ExerciseSearch, type ExerciseSearchEntry } from './ExerciseSearch';
import type { Muscle } from './Muscle';

// Core has neither DOM nor Node types; the tests run in Node, where `performance` exists.
declare const performance: { now(): number };

const MILLISECONDS_PER_DAY = 86_400_000;
const NOW = new Date(1_800_000_000_000);

interface EntryOptions {
  readonly aliases?: readonly string[];
  readonly equipment?: Equipment;
  readonly primary?: readonly Muscle[];
  readonly secondary?: readonly Muscle[];
  readonly custom?: boolean;
  readonly usage?: number;
  readonly lastUsed?: Date;
}

function entry(id: number, name: string, options: EntryOptions = {}): ExerciseSearchEntry {
  return {
    id,
    name,
    aliases: options.aliases ?? [],
    equipment: options.equipment ?? null,
    primaryMuscles: options.primary ?? [],
    secondaryMuscles: options.secondary ?? [],
    isCustom: options.custom ?? false,
    usageCount: options.usage ?? 0,
    lastUsedAt: options.lastUsed ?? null,
  };
}

const FIXTURE: readonly ExerciseSearchEntry[] = [
  entry(1, 'Lateral Raise (Dumbbell)', { equipment: 'dumbbell', primary: ['side-delt'] }),
  entry(2, 'Lateral Raise (Cable)', { equipment: 'cable', primary: ['side-delt'] }),
  entry(3, 'Seated Lateral Raise (Dumbbell)', { equipment: 'dumbbell', primary: ['side-delt'] }),
  entry(4, 'Bayesian Curl (Cable)', { aliases: ['bayesian cable curl'], equipment: 'cable', primary: ['biceps'] }),
  entry(5, 'Romanian Deadlift (Barbell)', { aliases: ['rdl'], equipment: 'barbell', primary: ['hamstrings', 'glutes'] }),
  entry(6, 'Romanian Deadlift (Dumbbell)', { aliases: ['rdl'], equipment: 'dumbbell', primary: ['hamstrings', 'glutes'] }),
  entry(7, 'Lat Pulldown (Cable)', { equipment: 'cable', primary: ['lats'] }),
  entry(8, 'Pulldown (Machine)', { equipment: 'machine', primary: ['lats'] }),
  entry(9, 'Pull Up', { equipment: 'bodyweight', primary: ['lats'] }),
  entry(10, 'Triceps Pushdown (Cable - Rope)', { equipment: 'cable', primary: ['triceps'] }),
  entry(11, 'Wrist Curl (Dumbbell)', { aliases: ['palms up wrist curl'], equipment: 'dumbbell', primary: ['forearm-flexors'] }),
  entry(12, 'My Cable Thing', { equipment: 'cable', primary: ['chest'], custom: true }),
  entry(13, 'Cable Crossover', { equipment: 'cable', primary: ['chest'] }),
  entry(14, 'Bench Press (Barbell)', { equipment: 'barbell', primary: ['chest'] }),
  entry(15, 'Bench Dip', { equipment: 'bodyweight', primary: ['triceps'] }),
];

const search = new ExerciseSearch(FIXTURE);

function names(entries: readonly ExerciseSearchEntry[]): string[] {
  return entries.map((item) => item.name);
}

function top(query: string, count: number, library: ExerciseSearch): string[] {
  return names(library.results(query, {}, NOW)).slice(0, count);
}

describe('ExerciseSearch.results', () => {
  test('an exact name beats longer names', () => {
    expect(search.results('pull up', {}, NOW)[0]?.name).toBe('Pull Up');
  });

  test('slang, typos and plurals still find', () => {
    expect(search.results('latteral raises db', {}, NOW)[0]?.name).toBe('Lateral Raise (Dumbbell)');
    expect(search.results('bayseian', {}, NOW)[0]?.name).toBe('Bayesian Curl (Cable)');
    expect(search.results('bay', {}, NOW)[0]?.name).toBe('Bayesian Curl (Cable)');
    expect(search.results('triceps', {}, NOW)[0]?.name).toBe('Triceps Pushdown (Cable - Rope)');
  });

  test('an alias matches when the name does not', () => {
    const found = search.results('rdl', {}, NOW);
    expect(names(found).slice(0, 2).sort()).toEqual(['Romanian Deadlift (Barbell)', 'Romanian Deadlift (Dumbbell)']);
    expect(search.results('palms up', {}, NOW)[0]?.name).toBe('Wrist Curl (Dumbbell)');
  });

  test('a space inside a word still matches', () => {
    const found = names(search.results('pull down', {}, NOW));
    expect(found).toContain('Lat Pulldown (Cable)');
    expect(found).toContain('Pulldown (Machine)');
    expect(found[0]).toBe('Pulldown (Machine)');
  });

  test('every query token must match', () => {
    expect(search.results('lateral squat', {}, NOW)).toEqual([]);
    expect(search.results('zzzz', {}, NOW)).toEqual([]);
  });

  test('single-letter tokens only match whole words', () => {
    expect(search.results('b', {}, NOW)).toEqual([]);
  });

  test('fewer extra words rank higher', () => {
    const found = search.results('lateral raise dumbbell', {}, NOW);
    expect(names(found)).toEqual(['Lateral Raise (Dumbbell)', 'Seated Lateral Raise (Dumbbell)']);
  });

  test('equipment words match even when the name lacks them', () => {
    const custom = new ExerciseSearch([entry(1, 'Zottman Curl', { equipment: 'dumbbell' })]);
    expect(custom.results('dumbbell zottman', {}, NOW)).toHaveLength(1);
  });

  test('a usage boost reorders otherwise equal matches', () => {
    const unused = [entry(1, 'Curl (Cable)', { equipment: 'cable' }), entry(2, 'Curl (Band)', { equipment: 'band' })];
    expect(names(new ExerciseSearch(unused).results('curl', {}, NOW))).toEqual(['Curl (Band)', 'Curl (Cable)']);
    const used = [entry(1, 'Curl (Cable)', { equipment: 'cable', usage: 30 }), entry(2, 'Curl (Band)', { equipment: 'band' })];
    expect(names(new ExerciseSearch(used).results('curl', {}, NOW))).toEqual(['Curl (Cable)', 'Curl (Band)']);
  });

  test('recent use breaks ties', () => {
    const recent = new Date(NOW.getTime() - 3 * MILLISECONDS_PER_DAY);
    const old = new Date(NOW.getTime() - 90 * MILLISECONDS_PER_DAY);
    const entries = [
      entry(1, 'Curl (Cable)', { equipment: 'cable', lastUsed: old }),
      entry(2, 'Curl (Band)', { equipment: 'band', lastUsed: recent }),
    ];
    expect(names(new ExerciseSearch(entries).results('curl', {}, NOW))[0]).toBe('Curl (Band)');
  });

  test('usage does not beat a better word match', () => {
    const entries = [
      entry(1, 'Row (Cable)', { equipment: 'cable', usage: 200 }),
      entry(2, 'Rowing Machine', { equipment: 'machine' }),
    ];
    expect(new ExerciseSearch(entries).results('row', {}, NOW)[0]?.name).toBe('Row (Cable)');
    expect(new ExerciseSearch(entries).results('rowing', {}, NOW)[0]?.name).toBe('Rowing Machine');
  });

  test('an empty query lists everything by usage then name', () => {
    const ordered = new ExerciseSearch([entry(1, 'bravo'), entry(2, 'Alpha'), entry(3, 'Charlie', { usage: 5 })]);
    expect(names(ordered.results('', {}, NOW))).toEqual(['Charlie', 'Alpha', 'bravo']);
    expect(names(ordered.results('   ', {}, NOW))).toEqual(['Charlie', 'Alpha', 'bravo']);
  });
});

describe('ExerciseSearch filters', () => {
  test('the muscle filter matches primary muscles only', () => {
    const library = new ExerciseSearch([
      ...FIXTURE,
      entry(99, 'Incline Press', { primary: ['chest'], secondary: ['triceps'] }),
    ]);
    const triceps = library.results('', { muscle: 'triceps' }, NOW);
    expect(new Set(names(triceps))).toEqual(new Set(['Triceps Pushdown (Cable - Rope)', 'Bench Dip']));
  });

  test('equipment and custom filters combine with a query', () => {
    const cable = search.results('', { equipment: 'cable' }, NOW);
    expect(cable.every((item) => item.equipment === 'cable')).toBe(true);
    expect(cable).toHaveLength(6);
    const custom = search.results('', { customOnly: true }, NOW);
    expect(names(custom)).toEqual(['My Cable Thing']);
    const queried = search.results('cable', { muscle: 'chest' }, NOW);
    expect(new Set(names(queried))).toEqual(new Set(['My Cable Thing', 'Cable Crossover']));
  });

  test('an empty filter is no filter', () => {
    expect(search.results('', {}, NOW)).toHaveLength(FIXTURE.length);
    expect(search.results('', { customOnly: false }, NOW)).toHaveLength(FIXTURE.length);
  });
});

describe('ExerciseSearch.suggestions', () => {
  test('adjacent words are joined', () => {
    expect(search.suggestions('Cable Cross Over')[0]?.name).toBe('Cable Crossover');
  });

  test('unrelated names get nothing', () => {
    expect(search.suggestions('Zercher Squat')).toEqual([]);
    expect(search.suggestions('')).toEqual([]);
  });

  test('respects the limit and the order', () => {
    const found = search.suggestions('Lateral Raise Dumbbell', 2);
    expect(found).toHaveLength(2);
    expect(found[0]?.name).toBe('Lateral Raise (Dumbbell)');
  });

  test('uses aliases and equipment', () => {
    expect(search.suggestions('Seated Palms Up Wrist Curl (Dumbbell)')[0]?.name).toBe('Wrist Curl (Dumbbell)');
  });

  test('a limit of zero returns nothing', () => {
    expect(search.suggestions('Lateral Raise', 0)).toEqual([]);
  });
});

describe('ExerciseSearch on the bundled library', () => {
  const library = ExerciseLibrary.bundled();
  const bundled = new ExerciseSearch(
    library.exercises.map((exercise, offset) => ({
      id: offset + 1,
      name: exercise.name,
      aliases: exercise.aliases,
      equipment: exercise.equipment,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      isCustom: false,
      usageCount: 0,
      lastUsedAt: null,
    })),
  );

  test('search behaves on real names', () => {
    expect(top('rdl', 3, bundled)).toContain('Romanian Deadlift (Barbell)');
    expect(top('bay', 5, bundled)).toContain('Bayesian Curl (Cable)');
    expect(top('latteral raise db', 1, bundled)).toEqual(['Lateral Raise (Dumbbell)']);
    expect(top('ohp', 3, bundled)).toContain('Overhead Press (Barbell)');
    const pulldowns = names(bundled.results('pull down', {}, NOW));
    expect(pulldowns.slice(0, 5).every((name) => name.toLowerCase().includes('pulldown'))).toBe(true);
    expect(pulldowns.length).toBeGreaterThan(0);
  });

  test('suggestions map imported names', () => {
    const best = (name: string, count = 1): string[] => names(bundled.suggestions(name, count));
    expect(best('Bayesian Cable Curl')[0]).toBe('Bayesian Curl (Cable)');
    expect(best('Lat Machine Pull Over')[0]).toBe('Pullover (Machine)');
    expect(best('Low To High Single Arm Cable Cross Over')[0]).toBe('Low to High Cable Crossover');
    expect(best('Under Grip Row', 3)).toContain('Bent Over Row - Underhand (Barbell)');
    expect(best('Seated Palms Up Wrist Curl (Dumbbell)')[0]).toBe('Wrist Curl (Dumbbell)');
    expect(best('Reverse Forearm Extension')[0]?.startsWith('Reverse Wrist Curl')).toBe(true);
  });

/**
 * Heuristic: a regression guard, not a benchmark. A search normally takes a few milliseconds on the
 * Mac, but the suite often runs beside other builds, so a tight limit made this test flaky. 20 ms
 * still catches an accidental slowdown of several times.
 */
const KEYSTROKE_BUDGET_MILLISECONDS = 20;

describe('speed', () => {
  test('an empty query lists the whole library, and each keystroke search stays within budget', () => {
    expect(bundled.results('', {}, NOW).length).toBeGreaterThan(400);
    const queries = ['l', 'la', 'lat', 'late', 'latte', 'latter', 'latteral raise'];
    for (const query of queries) bundled.results(query, {}, NOW); // warm up the JIT, as a typing user already has
    const start = performance.now();
    for (const query of queries) bundled.results(query, {}, NOW);
    const averageMilliseconds = (performance.now() - start) / queries.length;
    expect(averageMilliseconds).toBeLessThan(KEYSTROKE_BUDGET_MILLISECONDS);
  });
});
});
