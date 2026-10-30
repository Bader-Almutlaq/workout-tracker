import { describe, expect, test } from 'vitest';
import { folderIdOf, folderOptions, folderValueOf } from './FolderChoice';

describe('folder choice', () => {
  test('Folders become options keyed by id', () => {
    expect(folderOptions([{ id: 3, name: 'Push' }])).toEqual([{ value: '3', label: 'Push' }]);
  });

  test('No folder is the empty value and round-trips', () => {
    expect(folderValueOf(null)).toBe('');
    expect(folderIdOf('')).toBeNull();
    expect(folderIdOf(folderValueOf(7))).toBe(7);
  });
});
