import { afterEach, expect, test, vi } from 'vitest';
import { DragGesture, DragGestureLimits } from './DragGesture';

afterEach(() => vi.useRealTimers());

test('a hold lifts and a drop reports its target', () => {
  vi.useFakeTimers();
  const lift = vi.fn();
  const gesture = new DragGesture(10, 20, lift);
  gesture.move(18, 20);
  vi.advanceTimersByTime(DragGestureLimits.holdMilliseconds);
  expect(lift).toHaveBeenCalledOnce();
  expect(gesture.isDragging).toBe(true);
  expect(gesture.drop(12)).toBe(12);
  expect(gesture.isDragging).toBe(false);
});

test('movement beyond the limit cancels the hold', () => {
  vi.useFakeTimers();
  const lift = vi.fn();
  const gesture = new DragGesture(0, 0, lift);
  gesture.move(9, 0);
  vi.advanceTimersByTime(DragGestureLimits.holdMilliseconds);
  expect(lift).not.toHaveBeenCalled();
  expect(gesture.drop(12)).toBeUndefined();
});

test('dropping outside a target cancels the lifted item', () => {
  vi.useFakeTimers();
  const gesture = new DragGesture(0, 0, () => {});
  vi.advanceTimersByTime(DragGestureLimits.holdMilliseconds);
  expect(gesture.drop(undefined)).toBeUndefined();
});
