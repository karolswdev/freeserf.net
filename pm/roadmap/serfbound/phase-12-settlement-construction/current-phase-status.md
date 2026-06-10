# Phase 12 — Settlement Construction

**Last updated:** 2026-06-10.
**Status:** in progress.

## Goal

Found a settlement on the generated world: place the castle, claim territory,
lay roads through the original road-building mode, and watch buildings go up
with authentic construction sprites.

## Scope

- **In:** TypeScript ports of the flag/road graph (`Flag.cs`, ~2,400 lines
  with state), road pathfinding (`Pathfinder.cs`), castle placement and
  territory claim, the building lifecycle from `Building.cs` (~2,600 lines
  with state) through construction completion, building/road rendering with
  path masks, and a minimal functional build UI.
- **Out:** Serfs actually doing the construction work (Phase 13 — this phase
  may time-step construction directly), the authentic panel/popup UI
  (Phase 16), economy behavior (Phase 14), military (Phase 15).

## Non-negotiable constraints

- Graph and pathfinding behavior is parity-checked against reference fixtures.
- Every story that changes the screen ships real-data screenshot evidence.
- The minimal build UI is explicitly temporary and must not block the Phase 16
  authentic interface.

## Exit criteria (evidence required)

- [x] Flags connect into a road graph with reference-equivalent merge/split
  semantics (SB-12-01); path costs land with SB-12-02.
- [ ] The castle places under original validity rules and claims territory
  with rendered borders. (SB-12-03)
- [ ] Buildings progress visually from cleared ground to frame to finished
  building using authentic construction sprites. (SB-12-04)
- [ ] A browser user can found a small settlement end-to-end (castle → road →
  hut) with screenshot evidence from real local data. (SB-12-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-12-01 | Port the flag and road graph | done | story-01-flag-and-road-graph.md | evidence-story-01.md |
| SB-12-02 | Port road pathfinding and road-building mode | in-progress | story-02-road-pathfinding-mode.md | — |
| SB-12-03 | Place the castle and claim territory | backlog | story-03-castle-and-territory.md | — |
| SB-12-04 | Construct buildings with progress sprites | backlog | story-04-building-construction.md | — |
| SB-12-05 | Found a settlement end-to-end | backlog | story-05-settlement-end-to-end.md | — |

## Where we are

SB-12-01 is done: the engine has a real game world (paths/owners/objects
over the generated landscape) with reference flag/road graph semantics
including split and merge. SB-12-02 (pathfinding + road mode) is in
progress.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Flag graph semantics are subtle (merge, split, search) | high | Port state classes 1:1 with fixture parity on graph operations | Any divergence on graph fixtures |
| Construction without serfs invents fake behavior | medium | Time-step construction behind an explicit interim flag, replaced in Phase 13 | Interim path leaks into Phase 13+ behavior |
| Temporary build UI accretes scope | medium | Keep it testid-driven and minimal; Phase 16 replaces it | UI stories ballooning in this phase |

## Decisions made (this phase)

- 2026-06-10 — Graph operations are verified by scenario tests with
  reference-derived expectations instead of Python-mirror fixtures; the
  reference graph code's serf branches don't exist yet and are deferred to
  Phase 13 with code markers — SB-12-01.

## Decisions deferred

- Demolition/burning flows may land here or in Phase 14 depending on size.
