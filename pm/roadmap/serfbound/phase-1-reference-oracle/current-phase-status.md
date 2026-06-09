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

- [x] At least three reference outputs are captured from real source files and
  documented with commands.
- [x] At least one output is data-free and can run in CI.
- [x] At least one output uses the ignored local `SPAU.PA` source and is marked
  local/manual.
- [x] Reference outputs have stable, reviewable formats such as JSON/text/binary
  snapshots with checksums.
- [x] Any C# capture helper is explicitly isolated from product code and has a
  deletion or quarantine rule; no C# helper exists yet, and all temporary
  Python reference helpers are quarantined under `reference-tools/`.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-1-01 | Select first oracle targets | done | story-01-select-oracle-targets.md | evidence-story-01.md |
| SB-1-02 | Capture data-free reference output | done | story-02-data-free-reference-output.md | evidence-story-02.md |
| SB-1-03 | Capture local SPAU.PA resource output | done | story-03-local-spau-resource-output.md | evidence-story-03.md |
| SB-1-04 | Define oracle fixture contract | done | story-04-oracle-fixture-contract.md | evidence-story-04.md |
| SB-1-05 | Capture map geometry reference output | done | story-05-map-geometry-reference-output.md | evidence-story-05.md |

## Where we are

Phase 1 is complete. The final audit is recorded in `final-summary.md` and links
every shipped story, evidence file, command, known limitation, and deferred
item. Phase 2 is ready to start with SB-2-01: scaffold the pure-browser
workspace and restore a working browser-native toolchain.

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
- 2026-06-09 — Use isolated Python reference tooling for the first RNG fixture
  because local `dotnet` and Node toolchains are unavailable/broken in this
  environment; the helper lives under `pm/roadmap/serfbound/reference-tools/`
  and is not product code — SB-1-02 capture.
- 2026-06-09 — Capture `SPAU.PA` only as local/manual metadata — output lives
  under ignored `serfbound-local-data/reference-output/`, records the inventory
  checksum, catalog entry counts, resource availability, and metadata
  checksums, and writes no original asset payload — SB-1-03 capture.
- 2026-06-09 — Treat the DOS archive as an 8-byte little-endian header followed
  by entry metadata — the local file's first uint32 matches file size and the
  second uint32 is the 4,000-entry catalog count, matching the loader comment
  that entries follow an 8-byte header — SB-1-03 source/data inspection.
- 2026-06-09 — Use `map.geometry-facts` as Phase 1's third output — it is
  data-free, small enough to review, and protects Phase 3 map primitives,
  Phase 5 projection, and Phase 6 pointer-to-map interaction — SB-1-05 capture.
- 2026-06-09 — Adopt v1 oracle fixture contract — CI-safe fixtures live under
  `pm/roadmap/serfbound/reference-fixtures/ci/`, local/manual outputs stay
  ignored under `serfbound-local-data/reference-output/`, product code may read
  fixture data but must not import or execute reference helpers — SB-1-04.

## Decisions deferred

- Whether to repair local Node before Phase 2 starts — resolve before SB-2-01 —
  SB-1-02 could use Python because it is reference tooling only, but product
  implementation still needs a working browser-native toolchain.
- Whether to add C# cross-checks for source-derived Python fixtures when a C#
  toolchain is available — not required for Phase 1 exit, but required before
  Phase 3 claims full simulation parity.
- Phase 2 browser toolchain repair — local Node/npm are currently broken and
  must be fixed or replaced before SB-2-01 can prove build/test commands.
