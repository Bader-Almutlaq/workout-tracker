import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { Database } from '../src/core/db/Database';
import { migrate } from '../src/core/db/migrations';
import { ExerciseLibrary } from '../src/core/library/ExerciseLibrary';
import { ExerciseLibrarySeeder } from '../src/core/library/ExerciseLibrarySeeder';
import { exerciseIdNamed } from '../src/core/library/ExerciseNameResolver';
import source from '../data/sources/free-exercise-db/exercises.json';
import { buildLibrary, type LibraryMapping, type LibraryDecision, type SourceExercise } from './build-library';

// The committed mapping is validated by buildLibrary and the output's strict library parser.
const mapping = JSON.parse(readFileSync('data/sources/library-mapping.json', 'utf8')) as LibraryMapping;

const fixture: SourceExercise = {
  id: 'synthetic',
  name: 'Synthetic Raise',
  category: 'strength',
  equipment: 'dumbbell',
  mechanic: 'isolation',
  primaryMuscles: ['shoulders'],
  secondaryMuscles: [],
  instructions: ['Lift.', 'Lower.'],
  images: ['Synthetic/0.jpg', 'Synthetic/1.jpg'],
};

function convert(change: Partial<SourceExercise> = {}, decision: Partial<LibraryDecision> = {}) {
  return ExerciseLibrary.fromJson(
    buildLibrary([{ ...fixture, ...change }], {
      version: 2,
      baseFamilies: [],
      sources: { synthetic: { action: 'new', movement: 'Synthetic Raise', pattern: 'shoulder-flexion', ...decision } },
    }),
  ).exercises[0];
}

describe('library converter', () => {
  test('reproduces the committed output byte for byte and ignores input order', () => {
    const expected = readFileSync('src/core/library/library.json', 'utf8');
    expect(buildLibrary(source, mapping)).toBe(expected);
    expect(buildLibrary([...source].reverse(), mapping)).toBe(expected);
    const exercises = ExerciseLibrary.fromJson(expected).exercises;
    expect(exercises.length).toBeGreaterThanOrEqual(800);
    expect(exercises.length).toBeLessThanOrEqual(1000);
    expect(Object.keys(mapping.sources)).toHaveLength(source.length);
  });

  test.each([
    ['body only', 'bodyweight'],
    ['kettlebells', 'kettlebell'],
    ['e-z curl bar', 'ez-bar'],
    ['bands', 'band'],
  ])('maps equipment %s', (equipment, expected) => {
    expect(convert({ equipment })?.equipment).toBe(expected);
  });

  test.each([
    ['abdominals', 'abs'],
    ['quadriceps', 'quads'],
    ['middle back', 'upper-back'],
    ['traps', 'upper-traps'],
    ['abductors', 'hip-abductors'],
    ['forearms', 'forearm-flexors'],
  ])('maps muscle %s', (muscle, expected) => {
    expect(convert({ primaryMuscles: [muscle] })?.primaryMuscles).toEqual([expected]);
  });

  test.each([
    ['Side Lateral Raise', 'side-delt'],
    ['Rear Delt Raise', 'rear-delt'],
    ['Reverse Fly', 'rear-delt'],
    ['Face Pull', 'rear-delt'],
    ['Overhead Press', 'front-delt'],
  ])('splits shoulders for %s', (name, expected) => {
    expect(convert({ name })?.primaryMuscles).toEqual([expected]);
  });

  test('maps forearm extensions, removes duplicate/overlapping muscles, and accepts reviewed overrides', () => {
    expect(convert({ name: 'Reverse Wrist Extension', primaryMuscles: ['forearms'] })?.primaryMuscles).toEqual([
      'forearm-extensors',
    ]);
    expect(
      convert({ primaryMuscles: ['quadriceps', 'quadriceps'], secondaryMuscles: ['quadriceps'] })?.secondaryMuscles,
    ).toEqual([]);
    expect(convert({}, { primary: ['tibialis'] })?.primaryMuscles).toEqual(['tibialis']);
  });

  test('ambiguous equipment requires a review', () => {
    expect(() => convert({ equipment: null })).toThrow('Equipment needs review');
    expect(() => convert({ equipment: 'other' })).toThrow('Equipment needs review');
    expect(convert({ equipment: 'other' }, { equipment: 'plate' })?.equipment).toBe('plate');
  });

  test.each([
    { category: 'stretching' },
    { category: 'cardio' },
    { category: 'plyometrics' },
    { equipment: 'foam roll' },
    { equipment: 'medicine ball' },
    { equipment: 'exercise ball' },
    { name: 'Jump Squat' },
  ])('enforces exclusion rules: %j', (change) => {
    expect(() => convert(change)).toThrow('resistance exception');
    expect(convert(change, { action: 'skip' })).toBeUndefined();
  });

  test('allows a reviewed real resistance ball exercise', () => {
    expect(
      convert({ equipment: 'exercise ball' }, { equipment: 'bodyweight', resistanceException: true })?.equipment,
    ).toBe('bodyweight');
  });

  test('rejects missing decisions, stale decisions and nonexistent matches', () => {
    expect(() => buildLibrary([fixture], { version: 2, baseFamilies: [], sources: {} })).toThrow('Missing decision');
    expect(() =>
      buildLibrary([], { version: 2, baseFamilies: [], sources: { synthetic: { action: 'skip' } } }),
    ).toThrow('Stale source');
    expect(() => convert({}, { action: 'match' })).toThrow('Missing match family');
  });

  test('preserves every original name, key, primary muscle and equipment; all 420 names still resolve', async () => {
    const old = ExerciseLibrary.fromJson(JSON.stringify({ version: 1, families: mapping.baseFamilies }));
    const expanded = ExerciseLibrary.bundled();
    const originalNames = old.exercises.map((entry) => entry.name);
    expect(originalNames).toMatchSnapshot();
    expect(originalNames).toHaveLength(420);
    const db = await Database.openInMemory();
    try {
      migrate(db);
      ExerciseLibrarySeeder.seed(db, expanded, new Date('2026-01-01'));
      for (const entry of old.exercises) {
        expect(expanded.exercises.find((candidate) => candidate.key === entry.key)).toMatchObject({
          name: entry.name,
          equipment: entry.equipment,
          primaryMuscles: entry.primaryMuscles,
        });
        expect(exerciseIdNamed(db, entry.name)).toBeDefined();
      }
    } finally {
      db.close();
    }
  });

  test('small-muscle tags are secondary except on direct movements', () => {
    const exercises = ExerciseLibrary.bundled().exercises;
    expect(exercises.find((entry) => entry.name === 'Push Up')?.secondaryMuscles).toContain('serratus');
    expect(exercises.find((entry) => entry.name === 'Hammer Curl (Dumbbell)')?.secondaryMuscles).toEqual(
      expect.arrayContaining(['brachialis', 'brachioradialis']),
    );
    expect(exercises.find((entry) => entry.name === 'Cross-Body Y-Raise (Cable)')?.secondaryMuscles).toContain(
      'lower-traps',
    );
    expect(exercises.find((entry) => entry.name === 'Incline Serratus Punch (Barbell)')?.primaryMuscles).toEqual([
      'serratus',
    ]);
    expect(exercises.find((entry) => entry.name === 'Tibialis Raise (Smith Machine)')?.primaryMuscles).toEqual([
      'tibialis',
    ]);
  });
});

test('matches attach details only to the target variant; duplicate sources combine aliases deterministically', () => {
  const input = {
    version: 2,
    baseFamilies: [
      {
        movement: 'Press',
        pattern: 'horizontal-push',
        mechanic: 'compound',
        primary: ['chest'],
        secondary: ['triceps'],
        variants: ['barbell', 'dumbbell'],
      },
    ],
    sources: {
      a: { action: 'match', movement: 'Press' },
      b: { action: 'match', movement: 'Press' },
    },
  } satisfies LibraryMapping;
  const entries = [
    { ...fixture, id: 'b', name: 'Second source', equipment: 'barbell', instructions: ['Second.'] },
    { ...fixture, id: 'a', name: 'First source', equipment: 'barbell' },
  ];
  const output = ExerciseLibrary.fromJson(buildLibrary(entries, input)).exercises;
  expect(output[0]).toMatchObject({
    name: 'Press (Barbell)',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps'],
    instructions: 'Lift.\nLower.',
    aliases: ['First source', 'Second source'],
  });
  expect(output[1]).toMatchObject({ name: 'Press (Dumbbell)', instructions: null, imageKeys: [] });
});

test('reviewed unusual implements can record external weight instead of bodyweight reps', () => {
  expect(convert({ equipment: 'other' }, { equipment: 'weighted', tracking: 'weight-duration' })?.tracking).toBe(
    'weight-duration',
  );
});
