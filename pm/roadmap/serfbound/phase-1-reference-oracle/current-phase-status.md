# Phase 1 — Reference Oracle

**Last updated:** 2026-06-09.

## Goal

Capture enough trustworthy `freeserf.net` behavior to compare Serfbound against
it while keeping all .NET work isolated as temporary reference tooling, never
product runtime.

## Scope

- **In:** Reference-output selection, C# capture helpers if needed, local
  `SPAU.PA` smoke checks, deterministic map/state/resource outputs, fixture
  format, and oracle isolation rules.
- **Out:** Browser implementation, gameplay porting, renderer work, desktop
  packaging, or any dependency from Serfbound product code back to .NET.

## Exit criteria (evidence required)

- [ ] At least three reference outputs are captured from real source files and
  documented with commands.
- [ ] At least one output is data-free and can run in CI.
- [ ] At least one output uses the ignored local `SPAU.PA` source and is marked
  local/manual.
- [ ] Reference outputs have stable, reviewable formats such as JSON/text/binary
  snapshots with checksums.
- [ ] Any C# capture helper is explicitly isolated from product code and has a
  deletion or quarantine rule.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-1-01 | Select first oracle targets | backlog | story-01-select-oracle-targets.md | — |
| SB-1-02 | Capture data-free reference output | backlog | story-02-data-free-reference-output.md | — |
| SB-1-03 | Capture local SPAU.PA resource output | backlog | story-03-local-spau-resource-output.md | — |
| SB-1-04 | Define oracle fixture contract | backlog | story-04-oracle-fixture-contract.md | — |

## Where we are

Phase 1 is not started. It depends on Phase 0 inventory and parity-harness
design.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Oracle helpers become a shadow .NET runtime | high | Keep helpers under reference tooling only and forbid product imports | Browser code depends on a .NET artifact |
| Reference outputs are too broad to maintain | medium | Start with small map/resource/state facts | Captures cannot be reviewed in diffs |
| Local asset captures leak into Git | high | Keep local-output policy explicit | A committed fixture contains original asset payload |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Exact first oracle targets — resolve in SB-1-01 — default to map/random,
  resource catalog, and serialization/state checks.
