# SB-23-01 — Turn-Window Match Model

- **Project:** serfbound
- **Phase:** 23
- **Status:** done
- **Depends on:** SB-22-04
- **Unblocks:** SB-23-02
- **Owner:** Claude

## Problem

Async play is lockstep with giant turns: a match is (settings, seed,
action log), a move is the active player's tick-stamped action segment
for one session window plus the end-of-window checksum. The receiving
client must re-simulate the window trustlessly and reject invalid or
tampered moves recoverably.

## Scope

- **In:** The `CorrespondenceMatch` model over the Phase 22 primitives:
  window bounds (configurable ticks per window, alternating active
  player), capturing the active player's actions into a window move,
  applying a received move by re-simulation with checksum verification,
  out-of-player-window action rejection, resume-by-replay from tick 0,
  and a versioned move message on the session protocol.
- **Out:** Digests/recap (SB-23-02), UX (SB-23-03), transports beyond
  in-process fixtures.

## Acceptance criteria

- [x] Two match instances advance window by window to identical
  checksums across several alternating windows.
- [x] A tampered or rules-invalid move rejects recoverably at apply
  time; the match state stays consistent.
- [x] A match resumes anywhere by replay from tick 0 within a
  fixture-asserted time budget.

## Test plan

- **Unit:** Window capture/apply/verify fixtures in CI, including
  tamper and invalid-action cases.
- **Integration / e2e:** n/a until SB-23-04.
- **Manual / device:** n/a.
- **Design handoff:** Match-model notes in the phase folder.

## Notes / open questions

- Preserves: determinism as the referee; the asset boundary on the
  wire.
- Browser boundary: none new (engine logic).
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
