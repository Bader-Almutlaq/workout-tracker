/** Heuristic: the owner's requested deliberate hold and movement allowance, in milliseconds and pixels. */
export const DragGestureLimits = Object.freeze({ holdMilliseconds: 400, movementPixels: 8 });

/** Tracks one pointer's hold, cancellation and drop without depending on the DOM. */
export class DragGesture {
  private lifted = false;
  private cancelled = false;
  private readonly timer: ReturnType<typeof setTimeout>;

  /** Starts a pending hold at the pointer's initial coordinates. */
  constructor(
    private readonly x: number,
    private readonly y: number,
    onLift: () => void,
  ) {
    this.timer = setTimeout(() => {
      if (this.cancelled) return;
      this.lifted = true;
      onLift();
    }, DragGestureLimits.holdMilliseconds);
  }

  /** True once the hold is picked up and until it is cancelled or dropped. */
  get isDragging(): boolean {
    return this.lifted && !this.cancelled;
  }

  /** Cancels a pending hold if movement exceeds the tolerance. */
  move(x: number, y: number): void {
    if (!this.lifted && Math.hypot(x - this.x, y - this.y) > DragGestureLimits.movementPixels) this.cancel();
  }

  /** Ends the gesture and returns the target only when the item was lifted. */
  drop(target: number | undefined): number | undefined {
    const result = this.isDragging ? target : undefined;
    this.cancel();
    return result;
  }

  /** Cancels the pending hold or active drag. */
  cancel(): void {
    this.cancelled = true;
    clearTimeout(this.timer);
  }
}
