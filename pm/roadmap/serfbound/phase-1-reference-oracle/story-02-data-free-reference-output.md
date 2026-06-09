# SB-1-02 — Capture Data-Free Reference Output

- **Project:** serfbound
- **Phase:** 1
- **Status:** ready
- **Depends on:** SB-1-01
- **Unblocks:** SB-1-04, SB-3-01, SB-3-02
- **Owner:** unassigned

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

- [ ] A command captures the chosen data-free oracle output.
- [ ] The command and output location are documented in Phase 1 evidence notes.
- [ ] The fixture is deterministic across two consecutive runs.
- [ ] The fixture contains no original game asset payload.
- [ ] The capture helper is isolated from final browser product code.

## Test plan

- **Unit:** Run the capture command twice and compare checksums.
- **Integration / Cypress:** n/a.
- **Manual / device:** Inspect the fixture to confirm it is reviewable and
  asset-free.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Prefer JSON or plain text for first fixtures. Binary fixtures are acceptable
only when byte layout is the behavior under test.
