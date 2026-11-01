import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { PointerEvent } from 'react';
import { useTimeChartGesture } from './useTimeChartGesture';
import { timeChartModel } from './timeChartModel';
import { TimeChartPolicy } from './timeChartMath';
import type { TimeChartProps } from './TimeChart.types';

const hooks = vi.hoisted((): { setters: ReturnType<typeof vi.fn>[]; cleanups: (() => void)[] } => ({
  setters: [],
  cleanups: [],
}));
vi.mock('react', () => ({
  useRef: (value: unknown) => ({ current: value }),
  useState: (value: unknown) => {
    const setter = vi.fn();
    hooks.setters.push(setter);
    return [value, setter];
  },
  useEffect: (effect: () => undefined | (() => void)) => {
    const cleanup = effect();
    if (cleanup !== undefined) hooks.cleanups.push(cleanup);
  },
}));
const props: TimeChartProps = {
  title: 'Synthetic',
  unit: 'kg',
  aggregation: 'max',
  formatValue: String,
  series: [
    {
      name: 'Press',
      points: Array.from({ length: 50 }, (_, index) => ({
        date: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
        value: index + 100,
      })),
    },
  ],
};
const history = { from: Date.parse('2026-01-01'), to: Date.parse('2026-02-19') };
const domain = { from: Date.parse('2026-01-10'), to: Date.parse('2026-02-10') };
beforeEach(() => {
  vi.useFakeTimers();
  hooks.setters = [];
  hooks.cleanups = [];
});
afterEach(() => {
  hooks.cleanups.forEach((cleanup) => cleanup());
  vi.useRealTimers();
});
function GestureFixture(expanded = false, rotated = false) {
  const capture = new Set<number>();
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const element = {
    querySelector: () => ({
      getBoundingClientRect: () => ({ left: 0, top: 0, width: rotated ? 160 : 430, height: rotated ? 430 : 160 }),
    }),
    setPointerCapture: (id: number) => capture.add(id),
    hasPointerCapture: (id: number) => capture.has(id),
    releasePointerCapture: (id: number) => capture.delete(id),
    addEventListener,
    removeEventListener,
  };
  const onDomain = vi.fn();
  const model = timeChartModel(props, domain, 430, 160, expanded);
  // This test double implements every element API used by the hook; it intentionally has no browser DOM.
  const ref = { current: element as unknown as HTMLDivElement };
  const result = useTimeChartGesture({
    model,
    ref,
    width: 430,
    height: 160,
    expanded,
    rotated,
    domain,
    history,
    onDomain,
  });
  function event(x: number, y: number, pointerId = 1): PointerEvent<HTMLDivElement> {
    // The tested handlers read only these pointer fields and the element methods above.
    return {
      clientX: x,
      clientY: y,
      pointerId,
      button: 0,
      currentTarget: element,
    } as unknown as PointerEvent<HTMLDivElement>;
  }
  return { ...result, event, onDomain, addEventListener, removeEventListener };
}

test('a 150ms hold reveals the rule and release clears it; cancellation does too', () => {
  const chart = GestureFixture();
  chart.handlers.onPointerDown(chart.event(200, 60));
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(null);
  vi.advanceTimersByTime(TimeChartPolicy.pressMilliseconds);
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(expect.any(String));
  chart.handlers.onPointerUp(chart.event(200, 60));
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(null);
  chart.handlers.onPointerDown(chart.event(200, 60));
  vi.advanceTimersByTime(TimeChartPolicy.pressMilliseconds);
  chart.handlers.onPointerCancel();
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(null);
});

test('horizontal drag inspects immediately; a vertical swipe yields to native page scrolling', () => {
  const chart = GestureFixture();
  chart.handlers.onPointerDown(chart.event(200, 60));
  chart.handlers.onPointerMove(chart.event(230, 61));
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(expect.any(String));
  chart.handlers.onPointerUp(chart.event(230, 61));
  hooks.setters[0]?.mockClear();
  chart.handlers.onPointerDown(chart.event(200, 60));
  chart.handlers.onPointerMove(chart.event(201, 90));
  vi.advanceTimersByTime(TimeChartPolicy.pressMilliseconds);
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(null);
  expect(hooks.setters[0]?.mock.calls.every(([value]) => value === null)).toBe(true);
});

test('expanded dragging pans, while hold then drag inspects without changing the window', () => {
  const chart = GestureFixture(true);
  chart.handlers.onPointerDown(chart.event(200, 60));
  chart.handlers.onPointerMove(chart.event(230, 61));
  expect(chart.onDomain).toHaveBeenCalled();
  chart.handlers.onPointerUp(chart.event(230, 61));
  chart.onDomain.mockClear();
  chart.handlers.onPointerDown(chart.event(200, 60));
  vi.advanceTimersByTime(TimeChartPolicy.pressMilliseconds);
  chart.handlers.onPointerMove(chart.event(230, 61));
  expect(chart.onDomain).not.toHaveBeenCalled();
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(expect.any(String));
});

test('expanded short tap exposes Open; double tap resets the whole history', () => {
  const chart = GestureFixture(true);
  chart.handlers.onPointerDown(chart.event(200, 60));
  chart.handlers.onPointerUp(chart.event(200, 60));
  expect(hooks.setters[1]).toHaveBeenLastCalledWith(true);
  vi.advanceTimersByTime(100);
  chart.handlers.onPointerDown(chart.event(201, 60));
  chart.handlers.onPointerUp(chart.event(201, 60));
  expect(chart.onDomain).toHaveBeenLastCalledWith(history);
  expect(hooks.setters[0]).toHaveBeenLastCalledWith(null);
});

test('two-finger pinch zooms and lifting either finger cannot accidentally open a session', () => {
  const chart = GestureFixture(true);
  chart.handlers.onPointerDown(chart.event(160, 60, 1));
  chart.handlers.onPointerDown(chart.event(260, 60, 2));
  chart.handlers.onPointerMove(chart.event(320, 60, 2));
  const zoom = chart.onDomain.mock.calls.at(-1)?.[0];
  expect(zoom.to - zoom.from).toBeLessThan(domain.to - domain.from);
  chart.handlers.onPointerUp(chart.event(320, 60, 2));
  chart.handlers.onPointerUp(chart.event(160, 60, 1));
  expect(hooks.setters[1]?.mock.calls.some(([value]) => value === true)).toBe(false);
});

test('portrait physical vertical pan maps to horizontal chart time', () => {
  const chart = GestureFixture(true, true);
  chart.handlers.onPointerDown(chart.event(80, 200));
  chart.handlers.onPointerMove(chart.event(80, 230));
  expect(chart.onDomain).toHaveBeenCalled();
});

test('unmount removes the nonpassive touch listener and cancels a pending hold', () => {
  const chart = GestureFixture();
  chart.handlers.onPointerDown(chart.event(200, 60));
  expect(chart.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
  hooks.cleanups.forEach((cleanup) => cleanup());
  hooks.setters[0]?.mockClear();
  vi.advanceTimersByTime(TimeChartPolicy.pressMilliseconds);
  expect(hooks.setters[0]).not.toHaveBeenCalled();
  expect(chart.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
});
