import { describe, expect, it } from 'vitest';
import { strengthTrend, type StrengthObservation } from './StrengthTrend';

function observation(date: string, e1rmKilograms: number, trendWeight = 1): StrengthObservation {
  return { date, e1rmKilograms, trendWeight };
}

describe('strengthTrend', () => {
  it('returns null values for no data and seeds a single session without a rate', () => {
    const now = new Date('2026-01-08');
    expect(strengthTrend([], now)).toEqual({ trend: [], latest: null, changePerWeekPercent: null });
    expect(strengthTrend([observation('2026-01-01', 100)], now)).toEqual({
      trend: [{ date: '2026-01-01', e1rmKilograms: 100, isHeld: false }],
      latest: 100,
      changePerWeekPercent: null,
    });
  });

  it('applies the exact report item 4 equation at irregular intervals', () => {
    const firstUpdate = 100 + (1 - Math.exp(-7 / 21)) * (110 - 100);
    const secondUpdate = firstUpdate + (1 - Math.exp(-3 / 21)) * (108 - firstUpdate);
    const result = strengthTrend(
      [observation('2026-01-01', 100), observation('2026-01-08', 110), observation('2026-01-11', 108)],
      new Date('2026-01-11'),
    );
    expect(result.trend[1]?.e1rmKilograms).toBeCloseTo(102.8346868942621, 12);
    expect(result.trend[1]?.e1rmKilograms).toBeCloseTo(firstUpdate, 12);
    expect(result.latest).toBeCloseTo(secondUpdate, 12);
    expect(result.changePerWeekPercent).toBeCloseTo(((secondUpdate / 100 - 1) * 100 * 7) / 10, 12);
  });

  it('reduces alpha for unknown effort without reducing the raw estimate', () => {
    const result = strengthTrend(
      [observation('2026-01-01', 100), observation('2026-01-08', 110, 0.5)],
      new Date('2026-01-08'),
    );
    expect(result.latest).toBeCloseTo(100 + 0.5 * (1 - Math.exp(-7 / 21)) * 10, 12);
  });

  it.each([115, 85])('accepts exactly 15%% deviation: %s kg', (value) => {
    const result = strengthTrend(
      [observation('2026-01-01', 100), observation('2026-01-08', value)],
      new Date('2026-01-08'),
    );
    expect(result.trend[1]?.isHeld).toBe(false);
  });

  it.each([115.01, 84.99])('holds more than 15%% deviation: %s kg', (value) => {
    const result = strengthTrend(
      [observation('2026-01-01', 100), observation('2026-01-08', value), observation('2026-01-15', 110)],
      new Date('2026-01-15'),
    );
    expect(result.trend[1]).toEqual({ date: '2026-01-08', e1rmKilograms: 100, isHeld: true });
    expect(result.latest).toBeCloseTo(100 + (1 - Math.exp(-14 / 21)) * 10, 12);
  });

  it('holds a final outlier without diluting the rate using its later date', () => {
    const values = [observation('2026-01-01', 100), observation('2026-01-08', 110)];
    const now = new Date('2026-01-15');
    const result = strengthTrend([...values, observation('2026-01-15', 200)], now);
    expect(result.latest).toBe(strengthTrend(values, now).latest);
    expect(result.changePerWeekPercent).toBe(strengthTrend(values, now).changePerWeekPercent);
  });

  it('allows explicit confirmation to release a held observation', () => {
    const result = strengthTrend(
      [observation('2026-01-01', 100), { ...observation('2026-01-08', 200), isConfirmed: true }],
      new Date('2026-01-08'),
    );
    expect(result.latest).toBeCloseTo(100 + (1 - Math.exp(-7 / 21)) * 100, 12);
    expect(result.trend[1]?.isHeld).toBe(false);
  });

  it('re-anchors faster after three weeks and approaches the session after a gap of months', () => {
    const first = observation('2026-01-01', 100);
    expect(strengthTrend([first, observation('2026-01-22', 110)], new Date('2026-01-22')).latest).toBeCloseTo(
      100 + (1 - Math.exp(-21 / 14)) * 10,
      12,
    );
    const result = strengthTrend([first, observation('2026-05-01', 110)], new Date('2026-05-01'));
    expect(result.latest).toBeCloseTo(100 + (1 - Math.exp(-120 / 14)) * 10, 12);
    expect(result.changePerWeekPercent).toBeNull();
    expect(strengthTrend([first, observation('2026-05-01', 200)], new Date('2026-05-01')).latest).toBe(100);
  });

  it('does not decay or extrapolate during inactivity, and expires the recent rate', () => {
    const values = [observation('2026-01-01', 100), observation('2026-01-08', 110)];
    const later = strengthTrend(values, new Date('2026-06-01'));
    expect(later.latest).toBe(strengthTrend(values, new Date('2026-01-08')).latest);
    expect(later.changePerWeekPercent).toBeNull();
    expect(later.trend).toHaveLength(2);
  });

  it('sorts a copy and handles equal timestamps with alpha zero and no rate', () => {
    const values = [observation('2026-01-08', 110), observation('2026-01-01', 100)];
    const original = [...values];
    expect(strengthTrend(values, new Date('2026-01-08')).trend[0]?.e1rmKilograms).toBe(100);
    expect(values).toEqual(original);
    const duplicate = strengthTrend(
      [observation('2026-01-01', 100), observation('2026-01-01', 110)],
      new Date('2026-01-01'),
    );
    expect(duplicate.latest).toBe(100);
    expect(duplicate.changePerWeekPercent).toBeNull();
  });

  it('skips invalid and future observations', () => {
    const invalid = [
      observation('invalid', 100),
      observation('2026-02-01', 100),
      observation('2026-01-01', 0),
      observation('2026-01-01', -1),
      observation('2026-01-01', NaN),
      observation('2026-01-01', Infinity),
      observation('2026-01-01', 100, 0),
      observation('2026-01-01', 100, 2),
      observation('2026-01-01', 100, NaN),
    ];
    expect(strengthTrend(invalid, new Date('2026-01-08')).trend).toEqual([]);
  });

  it('filters invalid timestamps before sorting valid observations', () => {
    const now = new Date('2026-01-08');
    const later = observation('2026-01-08', 110);
    const earlier = observation('2026-01-01', 100);
    const valid = [later, earlier];
    expect(strengthTrend([later, observation('invalid', 100), earlier], now)).toEqual(strengthTrend(valid, now));
    expect(strengthTrend(valid, new Date('invalid')).latest).toBeNull();
  });
});
