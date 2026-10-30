import { describe, expect, it, vi } from 'vitest';
import type { RecentVsBaselinePoint } from '../../../core/analytics/RecentVsBaseline';
import { signatureDifferenceText, signatureHeadline, signatureReadout } from './signatureReadout';

const point: RecentVsBaselinePoint = {
  date: '2026-10-14',
  recent: 18,
  baseline: 15.5,
  percentDifference: 16.129,
  classification: 'above',
};

describe('signature readout', () => {
  it('formats positive, negative, zero, rounded negative zero and missing percentages', () => {
    expect(signatureDifferenceText(12.1)).toBe('+12%');
    expect(signatureDifferenceText(-8.2)).toBe('−8%');
    expect(signatureDifferenceText(0)).toBe('0%');
    expect(signatureDifferenceText(-0.1)).toBe('0%');
    expect(signatureDifferenceText(null)).toBe('—');
  });

  it('names all training or the selected muscle without verdicts', () => {
    expect(signatureHeadline(point)).toEqual({ value: '+16%', caption: '7-day vs 28-day hard sets' });
    expect(signatureHeadline({ ...point, percentDifference: -8 }, 'Chest')).toEqual({
      value: '−8%',
      caption: '7-day vs 28-day Chest sets',
    });
  });

  it('distinguishes insufficient history from a measured zero', () => {
    expect(signatureHeadline(undefined)).toEqual({ value: '—', caption: 'Not enough history yet' });
    expect(signatureHeadline({ ...point, percentDifference: null }).caption).toBe('Not enough history yet');
    expect(signatureHeadline({ ...point, percentDifference: 0 }).value).toBe('0%');
  });

  it('shows the date, both set windows and difference with stable calendar dates', () => {
    try {
      vi.stubEnv('TZ', 'America/Los_Angeles');
      expect(signatureReadout(point)).toBe('Wed, Oct 14 · last 7 days 18 sets · baseline 15.5 · +16%');
      expect(signatureReadout({ ...point, recent: null, baseline: null, percentDifference: null })).toContain(
        'last 7 days — sets · baseline — · —',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
