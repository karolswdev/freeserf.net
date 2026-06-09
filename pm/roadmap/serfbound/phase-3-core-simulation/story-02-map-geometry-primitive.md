# SB-3-02 — Port Map Geometry Primitive

- **Project:** serfbound
- **Phase:** 3
- **Status:** done
- **Depends on:** SB-3-01, SB-1-02
- **Unblocks:** SB-3-03, SB-5-02, SB-6-01
- **Owner:** Codex

## Problem

Map geometry is the bridge between deterministic simulation and browser
rendering/input. If Serfbound gets coordinates wrong early, later renderer and
UI work will be expensive to unwind.

## Scope

- **In:** First map coordinate primitives, neighbor/direction helpers, bounds
  behavior, fixture-backed parity checks, and tests for projection consumers.
- **Out:** Full terrain generation, full pathfinding, rendering, UI interaction,
  or asset decoding.

## Acceptance criteria

- [x] Map geometry helpers exist in the engine boundary.
- [x] Tests cover representative positions, edges, neighbors, and direction
  logic from selected oracle targets.
- [x] Output matches the relevant oracle fixture or records an intentional
  divergence.
- [x] Renderer/input stories can consume the primitive without importing DOM
  code into the engine.
- [x] Documentation links the primitive to `Freeserf.Core` source files.

## Test plan

- **Unit:** Run map geometry tests.
- **Integration / Cypress:** n/a.
- **Manual / device:** Inspect parity output for representative coordinates.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `MapGeometry`, direction helpers, and pure projection helpers in
`@serfbound/engine`. Tests match every case in `map-geometry-facts.json`,
including sizes 3 and 4, edge wraparound, neighbor movement, direction cycles,
shortest signed distances, tile-to-map projection, map/view normalization, and
view-to-tile lookup against the fixture's synthetic height model.

There are no intentional behavior divergences from the captured fixture. The
only boundary note is scope: the primitive includes the first seven
`PositionAddSpirally()` offsets needed by `CoordinateSpace.MapSpaceToTileSpace()`
fixture samples, not the full 295-entry `Map` spiral pattern used by later
search/pathfinding code.
