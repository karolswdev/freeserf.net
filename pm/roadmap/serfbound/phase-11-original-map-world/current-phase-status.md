# Phase 11 — Original Map and Scrollable World

**Last updated:** 2026-06-10.
**Status:** ready (next phase).

## Goal

Replace the synthetic terrain field with the original map generator and make
the world a real, scrollable place: same-seed maps match the reference
implementation tile-for-tile and render with authentic art, waves, and
borders.

## Scope

- **In:** Reference oracle fixtures for generated maps; TypeScript port of
  `Freeserf.Core/MapGenerator.cs` (heights, terrain typing) and the remaining
  `Map.cs` world model (object/mineral placement); a scrolling, wrapping
  viewport over the Phase 10 decoded render path; water waves and map borders.
- **Out:** Buildings, roads, serfs, minimap (Phase 16), AI, audio, touch
  controls (Phase 19).

## Non-negotiable constraints

- Map generation must be deterministic and parity-checked against reference
  fixtures, not eyeballed.
- CI stays data-free: parity fixtures are generated metadata, never original
  asset bytes.
- The phase gate is a scrollable, authentic-looking generated world from real
  local `SPAU.PA`, captured via the standing visual gate
  (`npm run capture:local:screenshots`).

## Exit criteria (evidence required)

- [ ] A committed CI-safe oracle fixture records heights, terrain types, and
  map objects for at least one small seed; the TypeScript generator matches it
  exactly. (SB-11-01, SB-11-02)
- [ ] Generated maps place trees, stones, deserts, water bodies, and mineral
  deposits per the reference rules. (SB-11-03)
- [ ] The browser viewport scrolls and wraps over the full generated map with
  decoded art, replacing the fixed synthetic field. (SB-11-04)
- [ ] Water animates with wave sprites and map edges render border sprites,
  with real-data screenshot evidence. (SB-11-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-11-01 | Capture map generator oracle fixtures | ready | story-01-map-generator-oracle.md | — |
| SB-11-02 | Port the classic map generator | backlog | story-02-port-classic-map-generator.md | — |
| SB-11-03 | Place map objects and minerals | backlog | story-03-map-objects-and-minerals.md | — |
| SB-11-04 | Scroll the generated world in the viewport | backlog | story-04-scrolling-wrapping-viewport.md | — |
| SB-11-05 | Render waves and map borders | backlog | story-05-waves-and-map-borders.md | — |

## Where we are

Phase 11 is scaffolded and ready. It starts when SB-11-01 captures generator
oracle fixtures from the reference implementation.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Generator port drifts subtly from reference RNG usage | high | Fixture parity per generation stage (heights → types → objects), not just final maps | Any tile mismatch on a fixture seed |
| Viewport scrolling breaks Phase 10 placement math | medium | Keep triangle placement identical; scrolling only changes the lattice window | Seams or holes while scrolling |
| Large maps slow scene rebuilds | medium | Rebuild only on scroll deltas; measure with the Phase 8 performance script | Frame cadence regression past Phase 8 baselines |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Minimap rendering belongs to Phase 16 (original interface).
