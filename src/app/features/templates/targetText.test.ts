import { describe, expect, test } from 'vitest';
import { targetText } from './targetText';

const none = { targetRepsLow: null, targetRepsHigh: null, targetRpe: null };

describe('target text', () => {
  test('A rep range and an RPE read as the owner wrote them', () => {
    expect(targetText({ targetRepsLow: 8, targetRepsHigh: 12, targetRpe: 8 })).toBe('8–12 @ RPE 8');
    expect(targetText({ targetRepsLow: 6, targetRepsHigh: 8, targetRpe: 8.5 })).toBe('6–8 @ RPE 8.5');
  });

  test('A range without an RPE and an RPE without a range stand alone', () => {
    expect(targetText({ ...none, targetRepsLow: 8, targetRepsHigh: 12 })).toBe('8–12');
    expect(targetText({ ...none, targetRpe: 7 })).toBe('RPE 7');
  });

  test('One number is a plain rep target, and equal ends collapse', () => {
    expect(targetText({ ...none, targetRepsLow: 5 })).toBe('5');
    expect(targetText({ ...none, targetRepsLow: 5, targetRepsHigh: 5 })).toBe('5');
    expect(targetText({ ...none, targetRepsHigh: 12 })).toBe('up to 12');
  });

  test('A set with no targets has no text', () => {
    expect(targetText(none)).toBe('');
  });
});
