import { expect, test } from 'vitest';
import { finishCheck } from './finishCheck';

const now = new Date('2026-10-31T20:00:00.000Z');
const detail = (start: string, completedAt: string | null, isCompleted = true) => ({
  workout: { startedAt: start },
  entries: [{ sets: [{ completedAt, isCompleted }] }],
});

test('nothing completed takes priority over short and idle checks', () => {
  expect(finishCheck(detail('2026-10-31T19:59:00.000Z', null, false), now, 'short')).toBe('empty');
});
test('a short workout prompts before idle and five minutes is excluded', () => {
  expect(finishCheck(detail('2026-10-31T19:57:00.000Z', '2026-10-31T18:00:00.000Z'), now, 'short')).toBe('short');
  expect(finishCheck(detail('2026-10-31T19:55:00.000Z', '2026-10-31T19:59:00.000Z'), now, 'short')).toBeUndefined();
});
test('idle check follows the short-workout answer and excludes exactly sixty minutes', () => {
  expect(finishCheck(detail('2026-10-31T19:57:00.000Z', '2026-10-31T18:59:59.000Z'), now, 'idle')).toBe('idle');
  expect(finishCheck(detail('2026-10-31T18:00:00.000Z', '2026-10-31T19:00:00.000Z'), now, 'idle')).toBeUndefined();
});
