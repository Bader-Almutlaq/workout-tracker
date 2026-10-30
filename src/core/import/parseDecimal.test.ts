import { describe, expect, test } from 'vitest';
import { parseDecimal } from './parseDecimal';

describe('parseDecimal', () => {
  test.each([
    ['12', 12],
    ['-3.5', -3.5],
    ['+2', 2],
    ['.5', 0.5],
    ['5.', 5],
    ['1e3', 1000],
    ['0.0', 0],
  ])('reads %s', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  test.each(['', ' ', 'abc', '0x10', 'Infinity', 'NaN', '1,5', '1_000', '5kg', '--5', '.'])('refuses "%s"', (text) => {
    expect(parseDecimal(text)).toBeUndefined();
  });
});
