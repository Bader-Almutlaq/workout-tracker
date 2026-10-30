import { describe, expect, it } from 'vitest';
import { muscleVolume } from '../../../core/analytics/MuscleVolume';
import { chooseVolume, historyRange, sortedVolume, volumeScale, zonePositions } from './volumeLayout';

const makeWeek = (weekStart: string, count: number) => ({
  weekStart,
  muscles: muscleVolume(
    Array.from({ length: count }, (_, index) => ({
      workoutId: index,
      muscle: 'chest' as const,
      role: 'primary' as const,
      kind: 'working' as const,
      rpe: null,
      isCompleted: true,
    })),
  ),
});

describe('weekly volume layout', () => {
  const weeks = [
    makeWeek('2026-10-05', 2),
    makeWeek('2026-10-12', 0),
    makeWeek('2026-10-19', 4),
    makeWeek('2026-10-26', 6),
  ];
  it('selects the current and previous week', () => {
    expect(chooseVolume(weeks, 'this')[0]?.totalSets).toBe(6);
    expect(chooseVolume(weeks, 'last')[0]?.totalSets).toBe(4);
    expect(chooseVolume([], 'last')).toEqual([]);
  });
  it('averages four weeks including zero weeks', () => {
    expect(chooseVolume(weeks, 'average')[0]?.totalSets).toBe(3);
  });
  it('sorts and scales volumes and places zone boundaries', () => {
    const muscles = chooseVolume(weeks, 'this');
    expect(sortedVolume(muscles)[0]?.muscle).toBe('chest');
    expect(volumeScale(muscles)).toBe(34);
    expect(zonePositions(40).map((zone) => [zone.label, zone.start, zone.width])).toEqual([
      ['<4', 0, 10],
      ['4–10', 10, 15],
      ['10–20', 25, 25],
      ['20–30', 50, 25],
      ['>30', 75, 25],
    ]);
  });
  it('covers twelve local calendar weeks across a year boundary', () => {
    const range = historyRange(new Date(2027, 0, 4, 12));
    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(9);
    expect(range.from.getDate()).toBe(19);
  });
});
