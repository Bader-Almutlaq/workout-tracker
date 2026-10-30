import { describe, expect, it, vi } from 'vitest';
import type { ExerciseStrengthSession } from '../../../core/queries/ExerciseStrength';
import {
  strengthBestSetText,
  strengthHeadlineText,
  strengthReadout,
  strengthWeeklyChangeText,
} from './strengthReadout';

const session: ExerciseStrengthSession = {
  workoutId: 1,
  date: '2026-03-04',
  e1rmKilograms: 121.5,
  bestSet: { weightKilograms: 100, reps: 6, rpe: 8 },
};

describe('strengthReadout', () => {
  it('shows the calendar day, both units and the original best set', () => {
    expect(strengthReadout(session, 'kg')).toBe('Mar 4, 2026 · e1RM 121.5 kg (267.86 lb) · best 100 kg × 6 @ RPE 8');
  });

  it('puts the display unit first and uses it for the best set', () => {
    expect(strengthReadout(session, 'lb')).toBe('Mar 4, 2026 · e1RM 267.86 lb (121.5 kg) · best 220.46 lb × 6 @ RPE 8');
  });

  it('preserves the calendar date in time zones west and east of UTC', () => {
    try {
      for (const zone of ['America/Los_Angeles', 'Asia/Riyadh']) {
        vi.stubEnv('TZ', zone);
        expect(strengthReadout(session, 'kg')).toContain('Mar 4, 2026');
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('does not invent missing RPE and preserves half steps', () => {
    expect(strengthBestSetText({ ...session, bestSet: { ...session.bestSet, rpe: null } }, 'kg')).toBe(
      '100 kg × 6 @ RPE unknown',
    );
    expect(strengthBestSetText({ ...session, bestSet: { ...session.bestSet, rpe: 8.5 } }, 'kg')).toBe(
      '100 kg × 6 @ RPE 8.5',
    );
  });

  it('uses the shared weight formatter for originally rounded pound loads', () => {
    expect(strengthBestSetText({ ...session, bestSet: { ...session.bestSet, weightKilograms: 61.23 } }, 'lb')).toBe(
      '135 lb × 6 @ RPE 8',
    );
  });
});

describe('strengthWeeklyChangeText', () => {
  it('formats positive and negative weekly percentages descriptively', () => {
    expect(strengthWeeklyChangeText(0.44)).toBe('+0.4% per week');
    expect(strengthWeeklyChangeText(-1.26)).toBe('-1.3% per week');
  });

  it('distinguishes missing rates from zero and avoids negative zero', () => {
    expect(strengthWeeklyChangeText(null)).toBe('—');
    expect(strengthWeeklyChangeText(0)).toBe('0.0% per week');
    expect(strengthWeeklyChangeText(-0.001)).toBe('0.0% per week');
  });
});

describe('strengthHeadlineText', () => {
  it('rounds a kilogram trend to the nearest half kilogram with at most one decimal', () => {
    expect(strengthHeadlineText(112.55, 'kg')).toBe('112.5 kg');
    expect(strengthHeadlineText(112.8, 'kg')).toBe('113 kg');
    expect(strengthHeadlineText(112.75, 'kg')).toBe('113 kg');
    expect(strengthHeadlineText(0, 'kg')).toBe('0 kg');
  });

  it('converts once and rounds a pound headline to whole pounds', () => {
    expect(strengthHeadlineText(121.5, 'lb')).toBe('268 lb');
    expect(strengthHeadlineText(61.23, 'lb')).toBe('135 lb');
  });
});
