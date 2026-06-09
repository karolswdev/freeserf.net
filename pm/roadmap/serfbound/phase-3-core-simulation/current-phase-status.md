# Phase 3 — Core Simulation

**Last updated:** 2026-06-09.

**Status:** complete; Phase 4 ready.

## Goal

Port the first deterministic gameplay primitives and prove them against Phase 1
oracle fixtures.

## Scope

- **In:** Numeric rules, random/map primitives, coordinate geometry, state/tick
  skeleton, serialization shape, and parity tests.
- **Out:** Rendering, audio, full economy, AI completeness, multiplayer, UI
  polish, or local asset import beyond consuming oracle fixtures.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] Data-free parity tests pass against at least one Phase 1 oracle fixture.
- [x] Numeric determinism and wrapping/overflow behavior are documented and
  tested.
- [x] Map/coordinate primitives have focused unit tests.
- [x] State/tick skeleton has at least one deterministic round-trip or snapshot
  comparison.
- [x] Known divergences from `Freeserf.Core` are documented with rationale.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-3-01 | Port deterministic numeric/random rules | done | story-01-numeric-random-rules.md | evidence-story-01.md |
| SB-3-02 | Port map geometry primitive | done | story-02-map-geometry-primitive.md | evidence-story-02.md |
| SB-3-03 | Add state and tick skeleton | done | story-03-state-tick-skeleton.md | evidence-story-03.md |
| SB-3-04 | Prove first simulation parity | done | story-04-first-simulation-parity.md | evidence-story-04.md |

## Where we are

Phase 3 is complete. SB-3-01 ported deterministic numeric helpers and
`FreeserfRandom` into `@serfbound/engine`, with tests matching every case in
the Phase 1 RNG fixture. SB-3-02 ported direction, wrapped map position,
movement, distance, and pure projection primitives against
`map-geometry-facts.json`. SB-3-03 added a deterministic state/tick skeleton
with stable snapshot/restore behavior and source-derived clock/counter rules.
SB-3-04 added the first combined engine parity proof over RNG, map movement,
and tick advancement. Phase 4 is ready to begin with local browser data import.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| JavaScript number behavior drifts from C# integers | high | Encode integer semantics explicitly | Parity failures cannot be explained or reproduced |
| Port surface grows too fast | high | Only port code required by selected fixtures | Story scope requires large gameplay systems at once |
| Serialization format becomes accidental | medium | Test byte/order or stable JSON explicitly | Saves cannot be compared or migrated later |

## Decisions made (this phase)

- 2026-06-09 — Start Phase 3 after the Phase 2 final audit — use
  `rng-fixed-seed-sequence.json` as the first parity target and keep
  implementation inside `@serfbound/engine` — Phase 2 completion audit.
- 2026-06-09 — Preserve `Freeserf.Core/Random.cs` behavior with explicit
  TypeScript fixed-width helpers and fixture-backed tests; no intentional RNG
  behavior divergences — SB-3-01.
- 2026-06-09 — Preserve the captured `Freeserf.Core/MapGeometry.cs` and
  `CoordinateSpace.cs` geometry/projection subset in pure TypeScript; no
  intentional fixture divergences, with full spiral/pathfinding deferred until
  a later fixture requires it — SB-3-02.
- 2026-06-09 — Introduce a browser-native `SerfboundGameState` skeleton that
  preserves source-derived tick/time/counter behavior and stable snapshots while
  deferring full map/player/serializer parity until dedicated evidence exists —
  SB-3-03.
- 2026-06-09 — Treat the first combined engine parity proof as a fixture-backed
  integration gate over RNG, map movement, and tick advancement; no intentional
  behavior divergence exists for the protected surface, while full gameplay,
  asset import, and serializer parity remain later phases — SB-3-04.

## Decisions deferred

- Full economy system order — decide after first tick parity — default to
  smallest visible build-loop dependency chain.
