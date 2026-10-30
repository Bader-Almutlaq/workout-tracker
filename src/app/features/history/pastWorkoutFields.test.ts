import { afterEach, expect, test, vi } from 'vitest';
import { durationSecondsFromMinutes, localWorkoutStart, workoutDurationMinutes } from './pastWorkoutFields';

afterEach(() => vi.unstubAllEnvs());

test('the local start input uses the phone timezone including a change of calendar date', () => {
  vi.stubEnv('TZ', 'Asia/Riyadh');
  expect(localWorkoutStart('2026-10-25T22:05:12.123Z')).toBe('2026-10-26T01:05');
});

test('the local start input follows daylight-saving offsets without treating UTC as local', () => {
  vi.stubEnv('TZ', 'America/New_York');
  expect(localWorkoutStart('2026-01-25T12:05:00.000Z')).toBe('2026-01-25T07:05');
  expect(localWorkoutStart('2026-07-25T12:05:00.000Z')).toBe('2026-07-25T08:05');
});

test('duration preserves zero, unknown values and fractional minutes across midnight', () => {
  expect(workoutDurationMinutes('2026-10-25T23:59:00.000Z', '2026-10-26T00:00:30.000Z')).toBe('1.5');
  expect(workoutDurationMinutes('2026-10-25T23:59:00.000Z', null)).toBe('');
  expect(workoutDurationMinutes('2026-10-25T23:59:00.000Z', '2026-10-25T23:59:00.000Z')).toBe('0');
  expect(durationSecondsFromMinutes('1.5')).toBe(90);
  expect(durationSecondsFromMinutes('')).toBeNull();
  expect(durationSecondsFromMinutes('0')).toBe(0);
});

test('invalid numeric durations reach core validation rather than silently becoming zero', () => {
  expect(durationSecondsFromMinutes('invalid')).toBeNaN();
  expect(durationSecondsFromMinutes('-1')).toBe(-60);
  expect(durationSecondsFromMinutes('Infinity')).toBe(Infinity);
});
