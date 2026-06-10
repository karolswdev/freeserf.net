# SB-11-04 — Scroll the Generated World in the Viewport

- **Project:** serfbound
- **Phase:** 11
- **Status:** done
- **Depends on:** SB-11-03
- **Unblocks:** SB-11-05
- **Owner:** unassigned

## Problem

Phase 10 renders a fixed window of a synthetic field. The decoded render path
must instead window into the generated map — scrolling by drag and keyboard,
wrapping at map edges like the original rhombus world — without breaking the
authentic triangle placement math.

## Scope

- **In:** Replace the synthetic field functions with engine map snapshot
  lookups; viewport scroll state (drag + arrow keys) over the decoded scene;
  map wrapping; pointer-to-tile mapping updated to the scrolled world;
  scene rebuild on scroll without visual seams.
- **Out:** Zoom (Phase 19), minimap navigation (Phase 16), waves (SB-11-05).

## Acceptance criteria

- [x] The decoded scene renders the generated map (terrain, objects) instead
  of the synthetic field; built flags stay anchored to map positions.
- [x] Dragging and arrow keys scroll smoothly; crossing the map edge wraps
  seamlessly.
- [x] Pointer hover/selection reports correct map positions while scrolled.
- [x] Frame cadence stays within Phase 8 performance baselines.

## Test plan

- **Unit:** Scene-structure tests for scrolled windows and wrapping.
- **Integration / Cypress:** Browser test scrolls and asserts scene/pointer
  state; screenshots before/after scroll.
- **Manual / device:** Real-data capture via the standing visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: RenderMap scrolling semantics (full tile column/row steps).
- Browser boundary: pointer capture for drag scrolling.
- .NET reference use: `RenderMap.cs`/`Viewport.cs` read as reference.
- Phase gate advanced: the world becomes a navigable place.
