// Touch gestures over PointerEvents (SB-21-04): pinch-zoom steps the
// world view scale, two-finger pan scrolls, and multi-touch suppresses
// the synthesized click that follows so single-finger taps stay intact.
// The tracker is pure event-in/action-out logic; timers (long-press)
// live with the caller.

export type GestureAction =
  | {
      readonly kind: "pinch";
      readonly direction: 1 | -1;
      // Gesture midpoint in client coordinates; zooming keeps the map
      // point under it stationary.
      readonly centerX: number;
      readonly centerY: number;
    }
  | { readonly kind: "pan"; readonly deltaX: number; readonly deltaY: number };

type TrackedPointer = { x: number; y: number };

// Pinch steps when the pointer distance grows or shrinks past these
// ratios, then rebases so a long pinch steps repeatedly.
const pinchInRatio = 1.25;
const pinchOutRatio = 0.8;

export class PointerGestureTracker {
  #pointers = new Map<number, TrackedPointer>();
  #pinchBaseDistance: number | null = null;
  #sawMultiTouch = false;

  get pointerCount(): number {
    return this.#pointers.size;
  }

  has(pointerId: number): boolean {
    return this.#pointers.has(pointerId);
  }

  // True when an incoming pointerdown makes this a multi-touch
  // interaction, regardless of whether this tracker saw the new pointer
  // yet (listener registration order varies).
  isSecondaryTouch(pointerId: number): boolean {
    return this.#pointers.size > 1 || (this.#pointers.size === 1 && !this.#pointers.has(pointerId));
  }

  // True once the interaction involved two or more pointers; the caller
  // suppresses the click/tap that browsers synthesize afterwards.
  get suppressesClick(): boolean {
    return this.#sawMultiTouch;
  }

  down(pointerId: number, x: number, y: number): void {
    this.#pointers.set(pointerId, { x, y });
    if (this.#pointers.size === 2) {
      this.#sawMultiTouch = true;
      this.#pinchBaseDistance = this.#distance();
    }
  }

  move(pointerId: number, x: number, y: number): GestureAction[] {
    const pointer = this.#pointers.get(pointerId);
    if (pointer === undefined) {
      return [];
    }

    if (this.#pointers.size !== 2) {
      pointer.x = x;
      pointer.y = y;
      return [];
    }

    const actions: GestureAction[] = [];
    const beforeCenter = this.#center();
    pointer.x = x;
    pointer.y = y;
    const afterCenter = this.#center();
    const deltaX = afterCenter.x - beforeCenter.x;
    const deltaY = afterCenter.y - beforeCenter.y;
    if (deltaX !== 0 || deltaY !== 0) {
      actions.push({ kind: "pan", deltaX, deltaY });
    }

    const distance = this.#distance();
    if (this.#pinchBaseDistance !== null && this.#pinchBaseDistance > 0) {
      const ratio = distance / this.#pinchBaseDistance;
      if (ratio >= pinchInRatio) {
        actions.push({
          kind: "pinch",
          direction: 1,
          centerX: afterCenter.x,
          centerY: afterCenter.y,
        });
        this.#pinchBaseDistance = distance;
      } else if (ratio <= pinchOutRatio) {
        actions.push({
          kind: "pinch",
          direction: -1,
          centerX: afterCenter.x,
          centerY: afterCenter.y,
        });
        this.#pinchBaseDistance = distance;
      }
    }

    return actions;
  }

  up(pointerId: number): void {
    this.#pointers.delete(pointerId);
    if (this.#pointers.size < 2) {
      this.#pinchBaseDistance = null;
    }
  }

  // Consume the suppression as the interaction ends: while two or more
  // fingers remain the flag survives (every lift of a multi-touch
  // gesture suppresses); the last lift clears it so the next
  // single-finger tap acts normally. Listener order between handlers is
  // irrelevant to the outcome.
  consumeClickSuppression(): boolean {
    if (this.#pointers.size >= 2) {
      return this.#sawMultiTouch;
    }

    const suppress = this.#sawMultiTouch;
    this.#sawMultiTouch = false;
    return suppress;
  }

  #distance(): number {
    const [first, second] = [...this.#pointers.values()];
    if (first === undefined || second === undefined) {
      return 0;
    }

    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  #center(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    for (const pointer of this.#pointers.values()) {
      x += pointer.x;
      y += pointer.y;
    }

    const count = Math.max(1, this.#pointers.size);
    return { x: x / count, y: y / count };
  }
}
