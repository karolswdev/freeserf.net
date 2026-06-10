import assert from "node:assert/strict";
import { test } from "node:test";

import { PointerGestureTracker } from "@serfbound/app";

// SB-21-04: the multi-touch gesture state machine — pinch steps, pan
// deltas, and click suppression around single-finger taps.

test("pinch in/out steps once past the threshold and rebases", () => {
  const tracker = new PointerGestureTracker();
  tracker.down(1, 100, 200);
  tracker.down(2, 200, 200); // distance 100

  // Slow spread below the 1.25x threshold: no step yet.
  assert.deepEqual(tracker.move(2, 220, 200), [
    { kind: "pan", deltaX: 10, deltaY: 0 },
  ]);

  // Crossing 125px distance steps in once and rebases.
  const actions = tracker.move(2, 230, 200);
  const pinch = actions.find((action) => action.kind === "pinch");
  assert.deepEqual(pinch, { kind: "pinch", direction: 1, centerX: 165, centerY: 200 });

  // Immediately after rebasing, the same distance produces no step.
  assert.equal(tracker.move(2, 231, 200).some((action) => action.kind === "pinch"), false);

  // Pinching back below 0.8x of the new base steps out.
  const out = tracker.move(2, 190, 200).find((action) => action.kind === "pinch");
  assert.equal(out?.direction, -1);
});

test("two-finger pan reports midpoint deltas", () => {
  const tracker = new PointerGestureTracker();
  tracker.down(1, 100, 100);
  tracker.down(2, 200, 100);

  // Real pans alternate small per-finger moves; each midpoint delta is
  // half the finger's move and the distance stays inside the pinch
  // thresholds.
  assert.deepEqual(tracker.move(1, 110, 100), [{ kind: "pan", deltaX: 5, deltaY: 0 }]);
  assert.deepEqual(tracker.move(2, 210, 110), [{ kind: "pan", deltaX: 5, deltaY: 5 }]);
});

test("multi-touch suppresses the trailing click; single taps never do", () => {
  const tracker = new PointerGestureTracker();

  // Single tap: no suppression.
  tracker.down(1, 50, 50);
  tracker.up(1);
  assert.equal(tracker.consumeClickSuppression(), false);

  // Two-finger gesture: both lifts suppress, then the flag clears.
  tracker.down(1, 50, 50);
  tracker.down(2, 150, 50);
  tracker.up(1);
  assert.equal(tracker.consumeClickSuppression(), true);
  tracker.up(2);
  assert.equal(tracker.consumeClickSuppression(), false, "flag cleared after the last lift");

  // The next single tap is unaffected.
  tracker.down(3, 60, 60);
  tracker.up(3);
  assert.equal(tracker.consumeClickSuppression(), false);
});

test("a second finger is recognized regardless of listener order", () => {
  const tracker = new PointerGestureTracker();
  // Finger 1 already tracked; finger 2's pointerdown may be inspected
  // before any tracker.down for it runs.
  tracker.down(1, 50, 50);
  assert.equal(tracker.isSecondaryTouch(2), true);
  assert.equal(tracker.isSecondaryTouch(1), false, "the tracked finger itself is primary");
  tracker.down(2, 150, 50);
  assert.equal(tracker.isSecondaryTouch(2), true);
});
