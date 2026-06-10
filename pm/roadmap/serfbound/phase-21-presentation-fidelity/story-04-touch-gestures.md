# SB-21-04 — Touch Gestures

- **Project:** serfbound
- **Phase:** 21
- **Status:** done
- **Depends on:** SB-21-03
- **Unblocks:** SB-21-05
- **Owner:** Claude

## Problem

Touch play today is single-pointer taps and drag-scroll. Real hands
expect gestures: pinch to zoom (now meaningful with SB-21-03 view
scales), two-finger pan, and long-press for tile context — without
breaking the existing single-finger flows.

## Scope

- **In:** A pointer-count gesture state machine over the existing
  PointerEvents path: pinch-zoom mapped to view scales, two-finger pan,
  long-press tile inspect, gesture/tap disambiguation, touch e2e
  coverage.
- **Out:** Camera-based hand tracking (recorded decision); haptics.

## Acceptance criteria

- [x] Pinch in/out steps the view scale around the gesture midpoint.
- [x] Two-finger pan scrolls; single-finger tap/drag behavior is
  unchanged. (Taps act on pointerup with slop now — recorded; drags and
  all e2e touch flows behave as before.)
- [x] Long-press surfaces the tile inspect path on touch.

## Test plan

- **Unit:** Gesture state machine transitions (pointer sequences) in CI.
- **Integration / e2e:** Multi-touch Playwright scenarios on the mobile
  viewport.
- **Manual / device:** Phone-viewport capture via the visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: adds browser-native input the original never had
  (divergence recorded as intentional).
- Browser boundary: input (multi-pointer gestures).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4.
