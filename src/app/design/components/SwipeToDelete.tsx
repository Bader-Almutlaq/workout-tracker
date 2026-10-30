import { Trash2 } from 'lucide-react';
import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import styles from './SwipeToDelete.module.css';

/** Width of the Delete button revealed by the swipe, in pixels. */
const REVEAL_WIDTH = 88;

/** How far a finger must travel before it counts as a swipe rather than a tap, in pixels. */
const DRAG_SLOP = 8;

interface Drag {
  readonly startX: number;
  readonly startY: number;
  readonly startOffset: number;
  /** Where the row was last moved to, so letting go doesn't depend on a render having happened. */
  offset: number;
  /** Unknown until the finger has moved past `DRAG_SLOP`: a mostly sideways move is a swipe, a mostly vertical one is scrolling. */
  isHorizontal: boolean | undefined;
}

/**
 * Lets a row be swiped left to reveal a Delete button. Vertical movement still scrolls the page.
 * A tap on the row while Delete is showing closes it instead of pressing what is under the finger.
 */
export function SwipeToDelete({
  label,
  onDelete,
  children,
}: {
  /** What the Delete button is called for screen readers, e.g. "Delete set". */
  readonly label: string;
  readonly onDelete: () => void;
  readonly children: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const drag = useRef<Drag | undefined>(undefined);
  const didDrag = useRef(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    didDrag.current = false;
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offset,
      offset,
      isHorizontal: undefined,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (current === undefined) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (current.isHorizontal === undefined) {
      if (Math.abs(deltaX) < DRAG_SLOP && Math.abs(deltaY) < DRAG_SLOP) return;
      current.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      if (!current.isHorizontal) {
        drag.current = undefined;
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    didDrag.current = true;
    current.offset = Math.min(0, Math.max(-REVEAL_WIDTH, current.startOffset + deltaX));
    setOffset(current.offset);
  };

  const onPointerEnd = () => {
    const current = drag.current;
    drag.current = undefined;
    if (current?.isHorizontal === true) setOffset(current.offset < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!didDrag.current && offset === 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (!didDrag.current) setOffset(0);
    didDrag.current = false;
  };

  return (
    <div className={styles.row}>
      {offset < 0 && (
        <button
          type="button"
          className={styles.action}
          aria-label={label}
          style={{ width: REVEAL_WIDTH }}
          onClick={onDelete}
        >
          <Trash2 size={20} strokeWidth={2} aria-hidden />
        </button>
      )}
      <div
        className={styles.content}
        style={offset === 0 ? undefined : { transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
