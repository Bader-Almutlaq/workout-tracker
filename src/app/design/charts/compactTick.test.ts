import { expect, test } from 'vitest';
import { compactTick } from './compactTick';
import { sessionDurationTick } from '../../features/templates/sessionDurationText';

test('compact ticks retain useful precision', () => {
  expect([15000, 1200, 800].map(compactTick)).toEqual(['15k', '1.2k', '800']);
});

test('duration ticks use minutes and hours', () => {
  expect([2700, 3600, 5400].map(sessionDurationTick)).toEqual(['45m', '1h', '1h 30m']);
});
