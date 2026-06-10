# Phase 11 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The synthetic terrain field is gone from running games: the classic map
generator is ported with exact tile-for-tile parity against reference
fixtures, the world scrolls and wraps in the browser with real decoded art,
and water animates with the original wave sprites and shore masking.

## Exit criteria — final state

- [x] Generator oracle fixtures committed (two seeds, full landscape arrays,
  reproducible byte-identical capture) — SB-11-01.
- [x] TypeScript generator matches the fixtures exactly on every array
  (heights, types, objects, minerals, resources) — SB-11-02.
- [x] Local games expose the landscape deterministically from the saved seed
  with placement-rule facts proven — SB-11-03.
- [x] Scrolling, wrapping viewport over the generated world with real art and
  real-data screenshot evidence — SB-11-04.
- [x] Animated waves with shore masking; the map-edge premise was re-scoped
  with source evidence (torus world; border art is territory art) — SB-11-05.

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-11-01 | Capture map generator oracle fixtures | evidence-story-01.md |
| SB-11-02 | Port the classic map generator | evidence-story-02.md |
| SB-11-03 | Place map objects and minerals | evidence-story-03.md |
| SB-11-04 | Scroll the generated world in the viewport | evidence-story-04.md |
| SB-11-05 | Render waves and map borders | evidence-story-05.md |

## What the phase intentionally did not do

- Height-aware pointer picking (CoordinateSpace port) — simple lattice picking
  shipped, divergence recorded.
- Territory borders (Phase 12), minimap (Phase 16), zoom (Phase 19).

## Carry-forward recommendations

1. Phase 12 should reuse `landscapeForLocalGameSettings` for castle/road
   validity checks against real terrain.
2. The wave timer is the app's first animation loop — Phase 13's serf
   animation should consolidate on a single tick driver.
3. Territory border rendering (`map_border` art) lands with SB-12-03.
