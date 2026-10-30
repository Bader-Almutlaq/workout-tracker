import { ImportError } from './ImportError';
import { trimWhitespace } from './trimWhitespace';

const BYTE_ORDER_MARK = '﻿';
const QUOTE = '"';

/**
 * A parsed CSV file: a header row plus data rows, all as strings.
 *
 * Follows RFC 4180: fields may be wrapped in double quotes, quoted fields may contain the
 * delimiter, line breaks and doubled quotes (`""` → `"`). Both `\n` and `\r\n` line endings are
 * accepted. A UTF-8 byte-order mark is ignored.
 */
export class CsvTable {
  private constructor(
    /** Column names from the first row, trimmed of surrounding spaces and tabs. */
    readonly header: readonly string[],
    /** Data rows, blank lines skipped. Each has at least `header.length` fields (short rows are padded with ""). */
    readonly rows: readonly (readonly string[])[],
  ) {}

  /**
   * Parses `text`. The delimiter is detected from the header line: semicolon if it contains more
   * semicolons than commas, otherwise comma.
   * @throws ImportError `emptyFile` if there is no header row, `unterminatedQuote` if a quoted
   *   field never closes.
   */
  static parse(text: string): CsvTable {
    const body = text.startsWith(BYTE_ORDER_MARK) ? text.slice(BYTE_ORDER_MARK.length) : text;
    const firstLine = body.split(/[\r\n]/, 1)[0] ?? '';
    const delimiter = count(firstLine, ';') > count(firstLine, ',') ? ';' : ',';

    const records = splitRecords(body, delimiter);
    const header = records[0];
    if (header === undefined || isBlankRecord(header)) throw new ImportError({ kind: 'emptyFile' });

    const rows = records
      .slice(1)
      .filter((record) => !isBlankRecord(record))
      .map((record) =>
        record.length >= header.length ? record : [...record, ...Array<string>(header.length - record.length).fill('')],
      );
    return new CsvTable(header.map(trimWhitespace), rows);
  }

  /** Index of the first column whose name matches any of `names` (case-insensitive). */
  columnIndex(...names: readonly string[]): number | undefined {
    const wanted = names.map((name) => name.toLowerCase());
    const index = this.header.findIndex((column) => wanted.includes(column.toLowerCase()));
    return index === -1 ? undefined : index;
  }
}

function count(text: string, character: string): number {
  return text.split(character).length - 1;
}

/** A blank line parses as one empty field. */
function isBlankRecord(record: readonly string[]): boolean {
  return record.length === 1 && record[0] === '';
}

/** Splits `text` into records of fields, honouring quotes. */
function splitRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let position = 0;

  const endRecord = (): void => {
    record.push(field);
    records.push(record);
    record = [];
    field = '';
    line += 1;
  };

  while (position < text.length) {
    const character = text.charAt(position);
    position += 1;

    if (inQuotes) {
      if (character === QUOTE) {
        if (text.charAt(position) === QUOTE) {
          field += QUOTE;
          position += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (character === '\n') line += 1;
        field += character;
      }
      continue;
    }

    if (character === QUOTE && field === '') {
      inQuotes = true;
    } else if (character === delimiter) {
      record.push(field);
      field = '';
    } else if (character === '\r') {
      // CRLF is one line break, not two.
      if (text.charAt(position) === '\n') position += 1;
      endRecord();
    } else if (character === '\n') {
      endRecord();
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new ImportError({ kind: 'unterminatedQuote', line });
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}
