import { expect, test } from 'vitest';
import { actionMenuPlacement } from './actionMenuPlacement';

test('opens upwards and clamps both horizontal edges', () => {
  const panel = { width: 200, height: 150 };
  const viewport = { width: 430, bottom: 850 };
  expect(actionMenuPlacement({ left: 0, right: 44, top: 800, bottom: 844 }, panel, viewport, 'end')).toEqual({
    left: 8,
    top: 650,
  });
  expect(actionMenuPlacement({ left: 410, right: 454, top: 100, bottom: 144 }, panel, viewport, 'start')).toEqual({
    left: 222,
    top: 144,
  });
});
