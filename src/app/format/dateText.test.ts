import { describe, expect, test } from 'vitest';
import { dayAndTimeText, dayText, dayWithYearText, durationText, monthLabel } from './dateText';

describe('date text', () => {
  test('Month label names the month and year', () => {
    expect(monthLabel(2024, 1)).toBe('January 2024');
    expect(monthLabel(2023, 12)).toBe('December 2023');
  });

  test('Days and times follow the requested time zone', () => {
    expect(dayText('2024-01-08T10:00:00.000Z', 'UTC')).toBe('Mon, Jan 8');
    expect(dayText('2024-01-08T22:30:00.000Z', 'Asia/Riyadh')).toBe('Tue, Jan 9');
    expect(dayAndTimeText('2024-01-08T10:00:00.000Z', 'UTC')).toBe('Mon, Jan 8, 2024, 10:00 AM');
  });

  test('Duration reads hours and minutes', () => {
    expect(durationText('2024-01-01T10:00:00.000Z', '2024-01-01T11:07:00.000Z')).toBe('1h 7m');
    expect(durationText('2024-01-01T10:00:00.000Z', '2024-01-01T10:59:00.000Z')).toBe('59m');
    expect(durationText('2024-01-01T10:00:00.000Z', '2024-01-01T12:00:00.000Z')).toBe('2h');
  });

  test('Duration is omitted when it is unknown or not positive', () => {
    expect(durationText('2024-01-01T10:00:00.000Z', null)).toBeUndefined();
    expect(durationText('2024-01-01T10:00:00.000Z', '2024-01-01T10:00:10.000Z')).toBeUndefined();
    expect(durationText('2024-01-01T10:00:00.000Z', '2024-01-01T09:00:00.000Z')).toBeUndefined();
  });

  test('A day with its year', () => {
    expect(dayWithYearText('2024-01-08T10:00:00.000Z', 'UTC')).toBe('Jan 8, 2024');
    expect(dayWithYearText('2024-01-08T22:30:00.000Z', 'Asia/Riyadh')).toBe('Jan 9, 2024');
  });
});
