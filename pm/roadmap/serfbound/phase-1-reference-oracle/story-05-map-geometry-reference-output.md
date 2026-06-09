# SB-1-05 — Capture Map Geometry Reference Output

- **Project:** serfbound
- **Phase:** 1
- **Status:** done
- **Depends on:** SB-1-01, SB-1-02
- **Unblocks:** SB-1-04, SB-3-02, SB-5-02, SB-6-01
- **Owner:** Codex

## Problem

Phase 1 needs a third reference output before it can exit honestly, and later
phases need exact map coordinate behavior before implementing simulation,
projection, or pointer interaction in the browser.

## Scope

- **In:** Capture a small CI-safe JSON fixture for map dimensions, direction
  cycles, turn/reverse behavior, position encode/decode, movement/wraparound,
  signed distances, and coordinate-space projection samples using synthetic
  heights.
- **Out:** Browser implementation, full map generation, real terrain import,
  rendering, asset parsing, or gameplay pathfinding.

## Acceptance criteria

- [x] A command captures `map.geometry-facts` into a committed CI-safe fixture.
- [x] The fixture names exact `freeserf.net` source files and commits.
- [x] The fixture covers at least two map sizes and includes wraparound cases.
- [x] The fixture includes direction cycle and turn/reverse samples.
- [x] The fixture includes projection samples tied to `RenderMap.TILE_WIDTH`
  and `RenderMap.TILE_HEIGHT`.
- [x] The fixture is deterministic across two consecutive runs.
- [x] The capture helper is isolated from final browser product code.

## Test plan

- **Unit:** Run the capture command twice and compare fixture checksums.
- **Integration / Cypress:** n/a.
- **Manual / device:** Inspect the JSON fixture for reviewable integer facts
  and confirm it contains no local asset data.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `map.geometry-facts` as
`pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json`. The helper
is source-derived Phase 1 reference tooling because the local C# toolchain is
unavailable.
