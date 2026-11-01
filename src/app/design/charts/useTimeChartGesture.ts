import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';
import type { TimeChartModel } from './timeChartModel';
import type { TimeChartDomain } from './TimeChart.types';
import {
  chartLocalPosition,
  clampChartDomain,
  nearestTimeMark,
  TimeChartPolicy,
  zoomChartDomain,
} from './timeChartMath';

interface Finger {
  readonly x: number;
  readonly y: number;
}

/** Press/drag, keyboard inspection and expanded pan/pinch with transient selection and complete cancellation cleanup. */
export function useTimeChartGesture({
  model,
  ref,
  width,
  height,
  expanded,
  rotated,
  domain,
  history,
  onDomain,
}: {
  readonly model: TimeChartModel;
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly width: number;
  readonly height: number;
  readonly expanded: boolean;
  readonly rotated: boolean;
  readonly domain: TimeChartDomain;
  readonly history: TimeChartDomain;
  readonly onDomain?: (domain: TimeChartDomain) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [openable, setOpenable] = useState(false);
  const fingers = useRef(new Map<number, Finger>());
  const gesture = useRef<{
    start: Finger;
    domain: TimeChartDomain;
    moved: boolean;
    mode: 'pending' | 'scrub' | 'pan' | 'pinch';
    distance: number;
    center: number;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<{ time: number; point: Finger } | null>(null);

  function clearTimer() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  function clearSelection() {
    setSelected(null);
    setOpenable(false);
  }
  function pick(x: number) {
    setSelected(nearestTimeMark(model.dates, Number(model.scales.x.invert(x))));
    setOpenable(false);
  }
  function position(event: PointerEvent<HTMLDivElement>): Finger {
    const svg = event.currentTarget.querySelector('svg');
    const bounds = svg?.getBoundingClientRect();
    if (bounds === undefined) return { x: 0, y: 0 };
    return chartLocalPosition({ x: event.clientX, y: event.clientY }, bounds, width, height, rotated);
  }
  function cancel() {
    clearTimer();
    fingers.current.clear();
    gesture.current = null;
    clearSelection();
  }
  useEffect(() => {
    const element = ref.current;
    // pan-y permits normal page scroll. Once a hold has won, prevent a later native touchmove from scrolling.
    function preventScrubScroll(event: TouchEvent) {
      if (gesture.current?.mode === 'scrub' && event.cancelable) event.preventDefault();
    }
    element?.addEventListener('touchmove', preventScrubScroll, { passive: false });
    return () => {
      element?.removeEventListener('touchmove', preventScrubScroll);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [ref]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    clearSelection();
    const point = position(event);
    fingers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (expanded && fingers.current.size === 2) {
      clearTimer();
      const [first, second] = [...fingers.current.values()];
      if (first === undefined || second === undefined) return;
      gesture.current = {
        start: point,
        domain,
        moved: true,
        mode: 'pinch',
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        center: (first.x + second.x) / 2,
      };
      return;
    }
    gesture.current = { start: point, domain, moved: false, mode: 'pending', distance: 0, center: point.x };
    clearTimer();
    timer.current = setTimeout(() => {
      const current = gesture.current;
      if (current?.mode !== 'pending') return;
      current.mode = 'scrub';
      pick(current.start.x);
    }, TimeChartPolicy.pressMilliseconds);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!fingers.current.has(event.pointerId)) return;
    const point = position(event);
    fingers.current.set(event.pointerId, point);
    const current = gesture.current;
    if (current === null) return;
    if (current.mode === 'pinch') {
      const [first, second] = [...fingers.current.values()];
      if (first === undefined || second === undefined) return;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      const spanPixels = model.scales.right - model.scales.left;
      const anchor = (current.center - model.scales.left) / spanPixels;
      const zoomed = zoomChartDomain(current.domain, history, distance / Math.max(1, current.distance), anchor);
      const shift = ((current.center - (first.x + second.x) / 2) / spanPixels) * (zoomed.to - zoomed.from);
      onDomain?.(clampChartDomain({ from: zoomed.from + shift, to: zoomed.to + shift }, history));
      return;
    }
    const dx = point.x - current.start.x;
    const dy = point.y - current.start.y;
    if (Math.hypot(dx, dy) > TimeChartPolicy.movementPixels) {
      current.moved = true;
      clearTimer();
      if (current.mode === 'pending') {
        if (!expanded && Math.abs(dy) > Math.abs(dx)) {
          cancel();
          return;
        }
        current.mode = expanded ? 'pan' : 'scrub';
      }
    }
    if (current.mode === 'scrub') pick(point.x);
    if (current.mode === 'pan') {
      const shift = (-dx / (model.scales.right - model.scales.left)) * (current.domain.to - current.domain.from);
      onDomain?.(clampChartDomain({ from: current.domain.from + shift, to: current.domain.to + shift }, history));
    }
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    const point = position(event);
    const tap = expanded && current?.mode === 'pending' && !current.moved;
    clearTimer();
    fingers.current.delete(event.pointerId);
    if (tap) {
      const now = Date.now();
      const previous = lastTap.current;
      if (
        previous !== null &&
        now - previous.time < TimeChartPolicy.doubleTapMilliseconds &&
        Math.hypot(previous.point.x - point.x, previous.point.y - point.y) < TimeChartPolicy.movementPixels * 2
      ) {
        onDomain?.(history);
        clearSelection();
        lastTap.current = null;
      } else {
        pick(point.x);
        setOpenable(true);
        lastTap.current = { time: now, point };
      }
    } else clearSelection();
    // A lifted pinch finger must not turn the remaining finger into a tap or scrub.
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      clearSelection();
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const index =
      selected === null
        ? model.dates.length - 1
        : model.dates.indexOf(selected) + (event.key === 'ArrowRight' ? 1 : -1);
    setSelected(model.dates[Math.max(0, Math.min(model.dates.length - 1, index))] ?? null);
    setOpenable(expanded);
  }
  return {
    selected,
    openable,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: cancel,
      onLostPointerCapture: () => {
        if (gesture.current !== null) cancel();
      },
      onKeyDown,
      onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) clearSelection();
      },
    },
  };
}
