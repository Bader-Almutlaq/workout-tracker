import { describe, expect, test } from 'vitest';
import { ExerciseLibraryError } from './ExerciseLibraryError';
import { parseLibraryFile } from './LibraryFile';

function problemWith(json: unknown): string {
  try {
    parseLibraryFile(json);
  } catch (error) {
    if (error instanceof ExerciseLibraryError) {
      expect(error.kind).toBe('malformed');
      return error.message;
    }
    throw error;
  }
  throw new Error('Expected the file to be rejected.');
}

const FAMILY = {
  movement: 'Row',
  pattern: 'horizontal-pull',
  mechanic: 'compound',
  primary: ['lats'],
  variants: ['cable'],
};

describe('parseLibraryFile', () => {
  test('reads a bare variant slug and an override object', () => {
    const file = parseLibraryFile({
      version: 3,
      families: [{ ...FAMILY, variants: ['cable', { equipment: 'band', name: 'Band Row', tracking: 'duration' }] }],
    });
    expect(file.version).toBe(3);
    expect(file.families[0]?.variants[0]).toMatchObject({ equipment: 'cable', name: undefined });
    expect(file.families[0]?.variants[1]).toMatchObject({ equipment: 'band', name: 'Band Row', tracking: 'duration' });
  });

  test('ignores unknown extra keys', () => {
    expect(parseLibraryFile({ version: 1, comment: 'hi', families: [{ ...FAMILY, note: 'x' }] }).families).toHaveLength(
      1,
    );
  });

  test('names the path of a missing field', () => {
    expect(problemWith({ version: 1 })).toContain('"families" is missing');
    expect(problemWith({ version: 1, families: [{ ...FAMILY, movement: undefined }] })).toContain('families[0]');
  });

  test('rejects wrong types', () => {
    expect(problemWith([])).toContain('expected an object');
    expect(problemWith({ version: '1', families: [] })).toContain('library.json.version: expected a whole number');
    expect(problemWith({ version: 1, families: {} })).toContain('library.json.families: expected a list');
    expect(problemWith({ version: 1, families: [{ ...FAMILY, movement: 3 }] })).toContain('expected text');
    expect(problemWith({ version: 1, families: [{ ...FAMILY, lengthened: 'yes' }] })).toContain(
      'expected true or false',
    );
  });

  test('rejects unknown vocabulary values with the offending value', () => {
    expect(problemWith({ version: 1, families: [{ ...FAMILY, pattern: 'sideways' }] })).toContain(
      '"sideways" is not a known movement pattern',
    );
    expect(problemWith({ version: 1, families: [{ ...FAMILY, mechanic: 'both' }] })).toContain(
      '"both" is not a known mechanic',
    );
    expect(problemWith({ version: 1, families: [{ ...FAMILY, tracking: 'reps' }] })).toContain(
      '"reps" is not a known tracking kind',
    );
    expect(problemWith({ version: 1, families: [{ ...FAMILY, variants: ['rope'] }] })).toContain(
      'families[0].variants[0]',
    );
    expect(problemWith({ version: 1, families: [{ ...FAMILY, variants: [{ name: 'No equipment' }] }] })).toContain(
      '"equipment" is missing',
    );
  });
});
