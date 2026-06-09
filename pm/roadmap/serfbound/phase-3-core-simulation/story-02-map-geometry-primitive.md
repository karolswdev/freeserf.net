# SB-3-02 — Port Map Geometry Primitive

- **Project:** serfbound
- **Phase:** 3
- **Status:** ready
- **Depends on:** SB-3-01, SB-1-02
- **Unblocks:** SB-3-03, SB-5-02, SB-6-01
- **Owner:** unassigned

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

- [ ] Map geometry helpers exist in the engine boundary.
- [ ] Tests cover representative positions, edges, neighbors, and direction
  logic from selected oracle targets.
- [ ] Output matches the relevant oracle fixture or records an intentional
  divergence.
- [ ] Renderer/input stories can consume the primitive without importing DOM
  code into the engine.
- [ ] Documentation links the primitive to `Freeserf.Core` source files.

## Test plan

- **Unit:** Run map geometry tests.
- **Integration / Cypress:** n/a.
- **Manual / device:** Inspect parity output for representative coordinates.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

This story should produce a small useful slice, not a complete map subsystem.
