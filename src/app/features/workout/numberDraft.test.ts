import { describe, expect, test } from 'vitest';
import {
  appendDecimalPoint,
  appendDigit,
  deleteLast,
  draftHasChanged,
  draftTextFor,
  draftValue,
  MAXIMUM_DRAFT_LENGTH,
  startDraft,
  stepDraft,
  typeKey,
  type NumberDraft,
} from './numberDraft';
import { digitKey } from './PadKey';

function typed(start: string, keys: readonly (number | '.' | '⌫')[]): NumberDraft {
  return keys.reduce((draft: NumberDraft, key) => {
    if (key === '.') return appendDecimalPoint(draft);
    if (key === '⌫') return deleteLast(draft);
    return appendDigit(draft, key);
  }, startDraft(start));
}

describe('number draft', () => {
  test('The first key replaces the value the cell started with', () => {
    expect(typed('135', [1, 4, 0]).text).toBe('140');
    expect(typed('135', ['.']).text).toBe('0.');
  });

  test('Later keys append, and a decimal point is accepted only once', () => {
    expect(typed('', [1, 0, 2, '.', 5]).text).toBe('102.5');
    expect(typed('', [1, '.', '.', 5]).text).toBe('1.5');
  });

  test('A leading zero is replaced by the next digit', () => {
    expect(typed('', [0, 7]).text).toBe('7');
  });

  test('The text stops growing at the maximum length', () => {
    const draft = typed('', [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(draft.text).toHaveLength(MAXIMUM_DRAFT_LENGTH);
    expect(draft.text).toBe('1234567');
  });

  test('Backspace removes the last character and does not replace the value', () => {
    expect(typed('135', ['⌫']).text).toBe('13');
    expect(typed('135', ['⌫', 5]).text).toBe('135');
    expect(typed('', ['⌫']).text).toBe('');
  });

  test('An unchanged draft is not saved, a changed one is', () => {
    expect(draftHasChanged(startDraft('135'))).toBe(false);
    expect(draftHasChanged(typed('135', [1, 3, 5]))).toBe(false);
    expect(draftHasChanged(typed('135', [1, 4, 0]))).toBe(true);
  });

  test('The value is null for empty text', () => {
    expect(draftValue(startDraft(''))).toBeNull();
    expect(draftValue(startDraft('102.5'))).toBe(102.5);
    expect(draftValue(typed('', [3, '.']))).toBe(3);
  });

  test('Stepping moves the value and treats an empty draft as 0', () => {
    expect(stepDraft(startDraft('60'), 2.5, 0, 1000).text).toBe('62.5');
    expect(stepDraft(startDraft(''), 5, 0, 1000).text).toBe('5');
    expect(stepDraft(startDraft('60'), -2.5, 0, 1000).text).toBe('57.5');
  });

  test('Stepping stays within the bounds', () => {
    expect(stepDraft(startDraft('1'), -2.5, 0, 1000).text).toBe('0');
    expect(stepDraft(startDraft('999'), 2.5, 0, 1000).text).toBe('1000');
    expect(stepDraft(startDraft(''), 0.5, 1, 10).text).toBe('1');
  });

  test('After a step the next digit appends instead of replacing', () => {
    expect(appendDigit(stepDraft(startDraft('6'), 1, 0, 1000), 5).text).toBe('75');
  });

  test('Draft text has no grouping and at most two decimals', () => {
    expect(draftTextFor(1234.5)).toBe('1234.5');
    expect(draftTextFor(61.2349)).toBe('61.23');
    expect(draftTextFor(0.1 + 0.2)).toBe('0.3');
    expect(draftTextFor(135)).toBe('135');
  });

  test('A pad key types the digit, the decimal point or backspace', () => {
    expect(typeKey(startDraft('135'), digitKey(7)).text).toBe('7');
    const seven = typeKey(startDraft(''), digitKey(7));
    const withPoint = typeKey(seven, { kind: 'decimalPoint' });
    expect(withPoint.text).toBe('7.');
    expect(typeKey(withPoint, { kind: 'backspace' }).text).toBe('7');
  });
});
