import { describe, expect, test } from 'vitest';
import type { SetKind } from '../models/SetKind';
import { findImplausibleSets, weightCorrection, type SetObservation } from './SetPlausibility';

const WEEK_MILLISECONDS = 7 * 86_400_000;

/** Weekly sessions of one exercise; `weights[i]` is session i's only working set. */
function history(weights: readonly number[], reps?: readonly number[], kind: SetKind = 'working'): SetObservation[] {
  return weights.map((weight, index) => ({
    id: index,
    exerciseKey: 'Squat',
    sessionKey: `s${index}`,
    date: new Date(index * WEEK_MILLISECONDS).toISOString(),
    kind,
    weightKilograms: weight,
    reps: reps?.[index] ?? 5,
  }));
}

describe('Typo detection', () => {
  test('An extra zero is flagged and the decimal shift is suggested', () => {
    const findings = findImplausibleSets(history([100, 100, 100, 100, 1000, 100, 100, 100]));
    expect(findings).toHaveLength(1);
    expect(findings[0]?.id).toBe(4);
    expect(findings[0]?.issue).toBe('weightTooHigh');
    expect(findings[0]?.suggestion).toBe(100);
    expect(findings[0]?.typical).toBe(100);
  });

  test('A missed digit is flagged as too low', () => {
    const findings = findImplausibleSets(history([70, 70, 72.5, 7, 72.5, 75, 75]));
    expect(findings.map((finding) => finding.id)).toEqual([3]);
    expect(findings[0]?.issue).toBe('weightTooLow');
  });

  test('A sustained jump in strength is not flagged', () => {
    expect(findImplausibleSets(history([60, 60, 60, 100, 100, 100, 100]))).toEqual([]);
  });

  test('Absurd reps are flagged and divided by ten when that fits', () => {
    const findings = findImplausibleSets(history(Array<number>(7).fill(50), [9, 9, 8, 81, 9, 9, 9]));
    expect(findings.map((finding) => finding.issue)).toEqual(['repsTooHigh']);
    expect(findings[0]?.suggestion).toBe(8);
  });

  test('Zero reps are always flagged; warm-ups never are', () => {
    expect(findImplausibleSets(history([100], [0])).map((finding) => finding.issue)).toEqual(['zeroReps']);
    expect(findImplausibleSets(history([100, 100, 100, 5, 100, 100], undefined, 'warmup'))).toEqual([]);
  });

  test('Too little history to judge: nothing flagged', () => {
    expect(findImplausibleSets(history([100, 1000, 100]))).toEqual([]);
  });

  test('A number typed in the wrong unit suggests the conversion', () => {
    // "30" meant as kg but saved as 30 lb (13.61 kg), in a ~35 kg exercise.
    const findings = findImplausibleSets(history([35, 35, 35, 13.607771, 35, 35, 35]));
    expect(findings.map((finding) => finding.issue)).toEqual(['weightTooLow']);
    expect(Math.abs((findings[0]?.suggestion ?? 0) - 30)).toBeLessThan(0.01);
  });
});

describe('Typo detection details beyond the native tests', () => {
  test('Failure sets are checked, drop sets are not', () => {
    expect(findImplausibleSets(history([100, 100, 100, 1000, 100, 100, 100], undefined, 'failure'))).toHaveLength(1);
    expect(findImplausibleSets(history([100, 100, 100, 1000, 100, 100, 100], undefined, 'drop'))).toEqual([]);
  });

  test('Exercises are judged separately', () => {
    const squat = history([100, 100, 100, 100, 100]);
    const curl = history([20, 20, 20, 20, 20]).map((set) => ({ ...set, id: set.id + 100, exerciseKey: 'Curl' }));
    expect(findImplausibleSets([...squat, ...curl])).toEqual([]);
  });

  test('Findings come back in the order of the observations', () => {
    const observations = history([100, 100, 100, 1000, 100, 100, 100, 100, 7, 100, 100, 100]);
    expect(findImplausibleSets(observations).map((finding) => finding.id)).toEqual([3, 8]);
  });

  test('Sessions are ordered by date, not by the order the sets are given', () => {
    const observations = history([100, 100, 100, 1000, 100, 100, 100]).reverse();
    expect(findImplausibleSets(observations).map((finding) => finding.id)).toEqual([3]);
  });

  test('Sets of one session are compared with the neighbouring sessions, not each other', () => {
    const observations = history([100, 100, 100, 100, 100, 100, 100]);
    observations.push({
      id: 99,
      exerciseKey: 'Squat',
      sessionKey: 's3',
      date: new Date(3 * WEEK_MILLISECONDS).toISOString(),
      kind: 'working',
      weightKilograms: 1000,
      reps: 5,
    });
    expect(findImplausibleSets(observations).map((finding) => finding.id)).toEqual([99]);
  });

  test('Bodyweight sets (zero weight) are never flagged as too low', () => {
    expect(findImplausibleSets(history([100, 100, 100, 0, 100, 100, 100]))).toEqual([]);
  });

  test('Reps above the minimum but within the ratio are not flagged', () => {
    expect(findImplausibleSets(history(Array<number>(7).fill(50), [20, 20, 20, 30, 20, 20, 20]))).toEqual([]);
  });

  test('Reps over the ratio but at the minimum are not flagged', () => {
    expect(findImplausibleSets(history(Array<number>(7).fill(50), [5, 5, 5, 25, 5, 5, 5]))).toEqual([]);
  });

  test('Absurd reps with no fitting tenth have no suggestion', () => {
    const findings = findImplausibleSets(history(Array<number>(7).fill(50), [9, 9, 9, 200, 9, 9, 9]));
    expect(findings[0]).toMatchObject({ issue: 'repsTooHigh', typical: 9, suggestion: null });
  });

  test('Only the weight check can fire when reps are typical', () => {
    const findings = findImplausibleSets(history([100, 100, 100, 300, 100, 100, 100]));
    expect(findings[0]).toMatchObject({ issue: 'weightTooHigh', typical: 100, suggestion: null });
  });

  test('The suggestion is the closest candidate to the typical weight', () => {
    expect(weightCorrection(1000, 100)).toBe(100);
    expect(weightCorrection(10, 100)).toBe(100);
    expect(weightCorrection(300, 100)).toBeNull();
    expect(weightCorrection(100 / 0.45359237, 100)).toBeCloseTo(100, 9);
  });
});
