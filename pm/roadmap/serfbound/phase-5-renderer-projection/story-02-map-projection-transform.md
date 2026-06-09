# SB-5-02 — Implement Map Projection Transform

- **Project:** serfbound
- **Phase:** 5
- **Status:** backlog
- **Depends on:** SB-5-01, SB-3-02
- **Unblocks:** SB-5-03, SB-6-01
- **Owner:** unassigned

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

- [ ] Projection helpers exist outside DOM-specific code where practical.
- [ ] Tests cover map-to-screen and screen-to-map representative cases.
- [ ] Behavior is documented against `Freeserf.Core/Rendering.txt`.
- [ ] Transform supports resize/viewport changes or records deferred handling.
- [ ] Phase 6 can consume the conversion without duplicating math.

## Test plan

- **Unit:** Projection and inverse-conversion tests.
- **Integration / Cypress:** n/a unless browser-specific sizing is included.
- **Manual / device:** Inspect a debug grid if implemented.
- **Design handoff:** n/a - non-visual primitive.

## Notes / open questions

Exact pixel parity is less important than stable, testable interaction mapping
at this stage.
