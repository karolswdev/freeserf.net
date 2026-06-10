# Phase 11 — Original Map and Scrollable World

**Last updated:** 2026-06-10.
**Status:** complete.

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

- [x] A committed CI-safe oracle fixture records heights, terrain types, and
  map objects for at least one small seed; the TypeScript generator matches it
  exactly. (SB-11-01, SB-11-02)
- [x] Generated maps place trees, stones, deserts, water bodies, and mineral
  deposits per the reference rules. (SB-11-03)
- [x] The browser viewport scrolls and wraps over the full generated map with
  decoded art, replacing the fixed synthetic field. (SB-11-04)
- [x] Water animates with wave sprites, with real-data screenshot evidence;
  "map edges" re-scoped with source evidence (the world is a torus; border
  art is territory-border art and ships with Phase 12 territory). (SB-11-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-11-01 | Capture map generator oracle fixtures | done | story-01-map-generator-oracle.md | evidence-story-01.md |
| SB-11-02 | Port the classic map generator | done | story-02-port-classic-map-generator.md | evidence-story-02.md |
| SB-11-03 | Place map objects and minerals | done | story-03-map-objects-and-minerals.md | evidence-story-03.md |
| SB-11-04 | Scroll the generated world in the viewport | done | story-04-scrolling-wrapping-viewport.md | evidence-story-04.md |
| SB-11-05 | Render waves and map borders | done | story-05-waves-and-map-borders.md | evidence-story-05.md |

## Where we are

Phase 11 is complete. Running games render the classic generator's world —
parity-proven tile-for-tile against reference fixtures — with real art,
animated water, and a scrolling, wrapping viewport. Real-data screenshot
evidence lives under artifacts/. The territory-border re-scope is recorded in
SB-11-05's evidence.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Generator port drifts subtly from reference RNG usage | high | Fixture parity per generation stage (heights → types → objects), not just final maps | Any tile mismatch on a fixture seed |
| Viewport scrolling breaks Phase 10 placement math | medium | Keep triangle placement identical; scrolling only changes the lattice window | Seams or holes while scrolling |
| Large maps slow scene rebuilds | medium | Rebuild only on scroll deltas; measure with the Phase 8 performance script | Frame cadence regression past Phase 8 baselines |

## Decisions made (this phase)

- 2026-06-10 — With no .NET SDK available, the generator oracle follows the
  Phase 1 pattern: a Python mirror of the C# source produces the fixture, and
  the TypeScript port is derived independently from the C# source so that
  fixture agreement means two independent derivations agree — SB-11-01.
- 2026-06-10 — The generator ports as one unit (heights through minerals)
  because its RNG stream spans all stages; SB-11-03 re-scopes to exposing the
  landscape through engine game state — SB-11-02.
- 2026-06-10 — The freeserf world is a torus: there is no map edge to draw.
  `map_border` art belongs to player territory borders
  (`RenderBorderSegment`) and ships with Phase 12 — SB-11-05.

## Decisions deferred

- Minimap rendering belongs to Phase 16 (original interface).
