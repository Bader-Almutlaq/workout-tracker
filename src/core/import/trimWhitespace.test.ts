import { describe, expect, test } from 'vitest';
import { trimWhitespace } from './trimWhitespace';

describe('trimWhitespace', () => {
  test('removes spaces, tabs and no-break spaces at both ends only', () => {
    expect(trimWhitespace(' \t a b  ')).toBe('a b');
  });

  test('keeps line breaks and the byte-order mark', () => {
    expect(trimWhitespace('\na\n')).toBe('\na\n');
    expect(trimWhitespace('﻿a')).toBe('﻿a');
  });

  test('an all-blank string becomes empty', () => {
    expect(trimWhitespace('   ')).toBe('');
  });
});
