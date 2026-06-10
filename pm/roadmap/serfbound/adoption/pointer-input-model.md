# Pointer Input Model

**Status:** accepted for Phase 6 SB-6-01.

## Boundary

Serfbound uses browser Pointer Events for the first map interaction primitive.
The app resolves canvas-relative pointer positions through the same
`MapProjectionTransform` path used by the renderer scene. It does not create a
separate input projection formula.

## Phase 6 SB-6-01 Contract

- Pointer coordinates are measured relative to the displayed WebGL canvas.
- The canvas backing buffer tracks the displayed CSS pixel size.
- `resolveFirstRenderLayerPointer()` maps screen coordinates to view, map, and
  tile coordinates through the Phase 5 projection transform.
- `pointermove` updates hover debug state.
- `pointerdown` updates selection debug state.
- No state-mutating game command is routed from pointer input yet.

## Mouse, Trackpad, And Touch Viability

- Mouse and trackpad input use the browser's normal pointer path with
  `pointerType === "mouse"` in Chromium. The SB-6-01 browser smoke covers that
  path through Playwright mouse movement and click events.
- Touch input uses the same Pointer Events handler. The canvas sets
  `touch-action: none` so the scene can receive touch-style pointer movement
  without browser panning hijacking the first interaction primitive.
- The SB-6-01 browser smoke dispatches a touch-style `PointerEvent` and verifies
  the same hover mapping path. Physical-device ergonomics remains SB-6-04
  because it belongs to interaction verification, not the first mapping
  primitive.
