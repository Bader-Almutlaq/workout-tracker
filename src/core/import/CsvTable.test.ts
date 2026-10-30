import { describe, expect, test } from 'vitest';
import { CsvTable } from './CsvTable';
import { expectImportError } from './fixtures/expectImportError';

describe('CSV parsing', () => {
  test('Quoted fields may contain the delimiter, line breaks and doubled quotes', () => {
    const table = CsvTable.parse('a,b,c\n"x, y","line1\nline2","say ""hi"""');
    expect(table.rows).toEqual([['x, y', 'line1\nline2', 'say "hi"']]);
  });

  test('Semicolon delimiter is detected from the header', () => {
    const table = CsvTable.parse('"a";"b"\n"1,5";"2"');
    expect(table.header).toEqual(['a', 'b']);
    expect(table.rows).toEqual([['1,5', '2']]);
  });

  test('BOM, CRLF line endings, blank lines and short rows are handled', () => {
    const table = CsvTable.parse('﻿a,b,c\r\n1,2\r\n\r\n3,4,5\r\n');
    expect(table.header).toEqual(['a', 'b', 'c']);
    expect(table.rows).toEqual([
      ['1', '2', ''],
      ['3', '4', '5'],
    ]);
  });

  test('Column lookup is case-insensitive', () => {
    const table = CsvTable.parse('Date,Exercise Name\n');
    expect(table.columnIndex('exercise name')).toBe(1);
    expect(table.columnIndex('Missing')).toBeUndefined();
    expect(table.columnIndex('Missing', 'DATE')).toBe(0);
  });

  test('An unterminated quote and an empty file are errors', () => {
    expectImportError(() => CsvTable.parse('a,b\n"open,1'), { kind: 'unterminatedQuote', line: 2 });
    expectImportError(() => CsvTable.parse(''), { kind: 'emptyFile' });
  });

  test('A line break inside a quoted value keeps CRLF as written and a lone CR ends a record', () => {
    const table = CsvTable.parse('a,b\r"x\r\ny",2\r3,4');
    expect(table.rows).toEqual([
      ['x\r\ny', '2'],
      ['3', '4'],
    ]);
  });

  test('Header names are trimmed of spaces and tabs', () => {
    expect(CsvTable.parse(' Date \t,Reps\n').header).toEqual(['Date', 'Reps']);
  });

  test('A quote in the middle of an unquoted field is kept as text', () => {
    expect(CsvTable.parse('a\n5" bar').rows).toEqual([['5" bar']]);
  });

  test('A header-only file has no rows, and a blank first line is an empty file', () => {
    expect(CsvTable.parse('a,b').rows).toEqual([]);
    expectImportError(() => CsvTable.parse('\n1,2'), { kind: 'emptyFile' });
  });
});
