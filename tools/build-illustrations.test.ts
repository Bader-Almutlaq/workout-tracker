import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { ExerciseLibrary } from '../src/core/library/ExerciseLibrary';
import { buildIllustrations, type IllustrationDecision, type IllustrationSource } from './build-illustrations';

const source: IllustrationSource[] = JSON.parse(readFileSync('data/sources/everkinetic/exercises.json', 'utf8'));
const mapping: Record<string, IllustrationDecision> = JSON.parse(
  readFileSync('data/sources/illustration-mapping.json', 'utf8'),
);
const keys = ExerciseLibrary.bundled().exercises.map((exercise) => exercise.key);

test('regenerates the bundled map byte for byte and honours skips', () => {
  const output = buildIllustrations(source, mapping, keys);
  expect(output).toBe(readFileSync('src/core/library/illustrations.json', 'utf8'));
  const result: Record<string, string> = JSON.parse(output);
  for (const [id, decision] of Object.entries(mapping)) {
    if (decision.action === 'skip') expect(Object.values(result)).not.toContain(id);
    else expect(result[decision.libraryKey]).toBe(id);
  }
});

test('keeps reviewed wording variants and selects one drawing for duplicates', () => {
  const result: Record<string, string> = JSON.parse(buildIllustrations(source, mapping, keys));
  expect(result['arnold-press-dumbbell']).toBe('0006');
  expect(result['lateral-raise-dumbbell']).toBe('0018');
  expect(result['front-raise-dumbbell']).toBe('0010');
  expect(result['seated-row-cable']).toBe('0025');
  expect(result['incline-bench-press-dumbbell']).toBe('0061');
  expect(result['chin-up']).toBe('0089');
  expect(Object.values(result)).not.toContain('0033');
  expect(Object.values(result)).not.toContain('0080');
});

test('rejects missing, stale, duplicate and unknown decisions', () => {
  expect(() => buildIllustrations([{ id_num: '0001' }], {}, keys)).toThrow('Missing decision');
  expect(() => buildIllustrations([], { '0001': { action: 'skip', reason: 'Unclear' } }, keys)).toThrow(
    'Stale decision',
  );
  expect(() =>
    buildIllustrations([{ id_num: '0001' }], { '0001': { action: 'match', libraryKey: 'unknown' } }, keys),
  ).toThrow('Invalid match');
  expect(() =>
    buildIllustrations(
      [{ id_num: '0001' }, { id_num: '0001' }],
      { '0001': { action: 'match', libraryKey: keys[0] ?? '' } },
      keys,
    ),
  ).toThrow('Duplicate source');
});
