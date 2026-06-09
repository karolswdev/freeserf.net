# SB-5-02 — Implement Map Projection Transform

- **Project:** serfbound
- **Phase:** 5
- **Status:** done
- **Depends on:** SB-5-01, SB-3-02
- **Unblocks:** SB-5-03, SB-6-01
- **Owner:** Codex

## Problem

The renderer and input shell need a shared conversion between map coordinates,
view coordinates, and screen coordinates. This must be tested before pointer
interactions depend on it.

## Scope

- **In:** Projection math, view transform, screen-to-view and view-to-map
  helpers, tests, and documentation against `Rendering.txt` concepts.
- **Out:** Full scene rendering, UI panels, asset atlas, or input command
  routing.

## Acceptance criteria

- [x] Projection helpers exist outside DOM-specific code where practical.
- [x] Tests cover map-to-screen and screen-to-map representative cases.
- [x] Behavior is documented against `Freeserf.Core/Rendering.txt`.
- [x] Transform supports resize/viewport changes or records deferred handling.
- [x] Phase 6 can consume the conversion without duplicating math.

## Test plan

- **Unit:** Projection and inverse-conversion tests.
- **Integration / Cypress:** n/a unless browser-specific sizing is included.
- **Manual / device:** Inspect a debug grid if implemented.
- **Design handoff:** n/a - non-visual primitive.

## Notes / open questions

Shipped in `@serfbound/engine` as `MapProjectionTransform`. The transform is
browser-neutral, composes existing fixture-backed `MapGeometry` projection
helpers, supports virtual-screen letterboxing and resize, and exposes shared
map/tile/view/screen conversion for renderer and Phase 6 input code.

Exact pixel parity remains less important than stable, testable interaction
mapping at this stage.
