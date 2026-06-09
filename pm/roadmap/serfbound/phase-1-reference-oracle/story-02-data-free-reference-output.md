# SB-1-02 — Capture Data-Free Reference Output

- **Project:** serfbound
- **Phase:** 1
- **Status:** done
- **Depends on:** SB-1-01
- **Unblocks:** SB-1-04, SB-3-01, SB-3-02
- **Owner:** Codex

## Problem

The project needs at least one reference output that can run without original
game data. This gives CI a stable behavioral anchor and keeps the first parity
test independent of local assets.

## Scope

- **In:** Add an isolated reference-capture command or test that emits one
  data-free output from existing C# behavior, plus a tracked fixture or checksum
  that Serfbound can consume later.
- **Out:** Product .NET code, browser implementation, local asset parsing, or
  broad gameplay porting.

## Acceptance criteria

- [x] A command captures the chosen data-free oracle output.
- [x] The command and output location are documented in Phase 1 evidence notes.
- [x] The fixture is deterministic across two consecutive runs.
- [x] The fixture contains no original game asset payload.
- [x] The capture helper is isolated from final browser product code.

## Test plan

- **Unit:** Run the capture command twice and compare checksums.
- **Integration / Cypress:** n/a.
- **Manual / device:** Inspect the fixture to confirm it is reviewable and
  asset-free.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `rng.fixed-seed-sequence` as JSON:
`pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json`.
The capture helper is isolated under
`pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py` and is not product
code.
