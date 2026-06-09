# Phase 3 — Core Simulation

**Last updated:** 2026-06-09.

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

- [ ] Data-free parity tests pass against at least one Phase 1 oracle fixture.
- [ ] Numeric determinism and wrapping/overflow behavior are documented and
  tested.
- [ ] Map/coordinate primitives have focused unit tests.
- [ ] State/tick skeleton has at least one deterministic round-trip or snapshot
  comparison.
- [ ] Known divergences from `Freeserf.Core` are documented with rationale.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-3-01 | Port deterministic numeric/random rules | backlog | story-01-numeric-random-rules.md | — |
| SB-3-02 | Port map geometry primitive | backlog | story-02-map-geometry-primitive.md | — |
| SB-3-03 | Add state and tick skeleton | backlog | story-03-state-tick-skeleton.md | — |
| SB-3-04 | Prove first simulation parity | backlog | story-04-first-simulation-parity.md | — |

## Where we are

Phase 3 is not started. It depends on Phase 1 reference outputs and Phase 2
test infrastructure.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| JavaScript number behavior drifts from C# integers | high | Encode integer semantics explicitly | Parity failures cannot be explained or reproduced |
| Port surface grows too fast | high | Only port code required by selected fixtures | Story scope requires large gameplay systems at once |
| Serialization format becomes accidental | medium | Test byte/order or stable JSON explicitly | Saves cannot be compared or migrated later |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Full economy system order — decide after first tick parity — default to
  smallest visible build-loop dependency chain.
