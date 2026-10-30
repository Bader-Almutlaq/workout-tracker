import { useRef, type PointerEvent, type KeyboardEvent } from 'react';
import { nearestChartPoint, type ChartPoint, type ChartScales } from './chartScales';
import styles from './ChartFrame.module.css';

/**
 * Captures a single pointer on the SVG and snaps to raw observations until release/cancel.
 * The plot owns its gesture (touch-action: none); the surrounding card may still pan vertically.
 * Arrow keys select observations; Escape or blur clears the readout. Empty data renders nothing.
 */
export function TouchRule({
  points,
  scales,
  selectedIndex,
  onSelect,
}: {
  readonly points: readonly ChartPoint[];
  readonly scales: ChartScales;
  readonly selectedIndex: number | null;
  readonly onSelect: (index: number | null) => void;
}) {
  const pointer = useRef<number | null>(null);
  const selected = selectedIndex === null ? undefined : points[selectedIndex];
  function selectAt(event: PointerEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (svg === null || matrix === null || matrix === undefined) return;
    const position = svg.createSVGPoint();
    position.x = event.clientX;
    position.y = event.clientY;
    onSelect(nearestChartPoint(points, scales.x, position.matrixTransform(matrix.inverse()).x));
  }
  function clear() {
    pointer.current = null;
    onSelect(null);
  }
  function navigate(event: KeyboardEvent<SVGRectElement>) {
    if (event.key === 'Escape') onSelect(null);
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = selectedIndex === null ? points.length - 1 : selectedIndex + (event.key === 'ArrowRight' ? 1 : -1);
    onSelect(Math.max(0, Math.min(points.length - 1, next)));
  }
  if (points.length === 0) return null;
  return (
    <g>
      {selected !== undefined && (
        <line
          className={styles.rule}
          x1={scales.x(new Date(selected.date))}
          x2={scales.x(new Date(selected.date))}
          y1={scales.top}
          y2={scales.bottom}
        />
      )}
      <rect
        className={styles.touch}
        x={scales.left}
        y={scales.top}
        width={scales.right - scales.left}
        height={scales.bottom - scales.top}
        tabIndex={0}
        role="slider"
        aria-label="Session estimate; drag or use arrow keys"
        aria-valuemin={1}
        aria-valuemax={points.length}
        aria-valuenow={(selectedIndex ?? points.length - 1) + 1}
        aria-valuetext={selected?.date ?? points.at(-1)?.date}
        onKeyDown={navigate}
        onBlur={clear}
        onPointerDown={(event) => {
          if (pointer.current !== null || event.button !== 0) return;
          event.preventDefault();
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          selectAt(event);
        }}
        onPointerMove={(event) => {
          if (pointer.current === event.pointerId) selectAt(event);
        }}
        onPointerUp={(event) => {
          if (pointer.current !== event.pointerId) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          clear();
        }}
        onPointerCancel={(event) => {
          if (pointer.current === event.pointerId) clear();
        }}
        onLostPointerCapture={clear}
      />
    </g>
  );
}
