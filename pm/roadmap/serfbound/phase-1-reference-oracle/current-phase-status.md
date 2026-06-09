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

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

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
| SB-1-01 | Select first oracle targets | done | story-01-select-oracle-targets.md | evidence-story-01.md |
| SB-1-02 | Capture data-free reference output | ready | story-02-data-free-reference-output.md | — |
| SB-1-03 | Capture local SPAU.PA resource output | ready | story-03-local-spau-resource-output.md | — |
| SB-1-04 | Define oracle fixture contract | ready | story-04-oracle-fixture-contract.md | — |

## Where we are

Phase 1 has started. SB-1-01 selected four oracle targets:
`rng.fixed-seed-sequence`, `map.geometry-facts`, `serializer.state-fixtures`,
and local/manual `dos.spau-catalog-metadata`. The next responsible move is
SB-1-02: capture the first data-free reference output, starting with the RNG
target.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Oracle helpers become a shadow .NET runtime | high | Keep helpers under reference tooling only and forbid product imports | Browser code depends on a .NET artifact |
| Reference outputs are too broad to maintain | medium | Start with small map/resource/state facts | Captures cannot be reviewed in diffs |
| Local asset captures leak into Git | high | Keep local-output policy explicit | A committed fixture contains original asset payload |

## Decisions made (this phase)

- 2026-06-09 — Use Phase 0 parity and asset-boundary docs as Phase 1 input —
  oracle targets must separate CI-safe data-free fixtures from local/manual
  `SPAU.PA` metadata — Phase 0 completion audit.
- 2026-06-09 — Capture RNG first, then expand only if fixtures stay small —
  `rng.fixed-seed-sequence` is the first data-free target; map geometry and
  serializer targets are selected but should not bloat SB-1-02 — SB-1-01 target
  selection.
- 2026-06-09 — Treat `dos.spau-catalog-metadata` as local/manual only —
  `SPAU.PA` protects Phase 4 parser work but remains ignored and metadata-only
  in committed evidence — SB-1-01 target selection.

## Decisions deferred

- Exact fixture schema fields — resolve in SB-1-04 — default to the schema
  baseline from `parity-harness-design.md` and target details from
  `oracle-targets.md`.
