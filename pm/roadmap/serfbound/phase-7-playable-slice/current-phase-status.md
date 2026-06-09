# Phase 7 — Playable Slice

**Last updated:** 2026-06-09.

## Goal

Deliver a local browser-playable slice that imports data, starts a game,
accepts player input, advances deterministic simulation, renders feedback, and
saves/loads state.

## Scope

- **In:** Local single-player flow, new-game setup, map interaction, first
  road/flag/building action, tick loop, save/load, pause/speed controls, and
  crash/error handling.
- **Out:** Multiplayer, full campaign/tutorial coverage, AI completeness,
  release branding, parity for every late-game system, desktop packaging, or
  .NET runtime dependencies.

## Exit criteria (evidence required)

- [ ] A user can open the browser client, import local data, start a game, and
  see the settlement map.
- [ ] One visible build/road/flag interaction mutates engine state and rendered
  output.
- [ ] The playable path runs in the browser with no desktop companion process.
- [ ] Save/load works in browser persistence and passes at least one round-trip
  test.
- [ ] Manual verification steps and screenshots/video are stored as evidence.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-7-01 | Start local game from imported data | backlog | story-01-start-local-game.md | — |
| SB-7-02 | Implement first visible build action | backlog | story-02-first-visible-build-action.md | — |
| SB-7-03 | Add browser save/load loop | backlog | story-03-browser-save-load-loop.md | — |
| SB-7-04 | Verify playable loop manually | backlog | story-04-playable-loop-verification.md | — |

## Where we are

Phase 7 is not started. It depends on Phases 3 through 6.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| First playable scope balloons into full game parity | high | Keep slice to one visible loop | Stories require late-game economy before basic build works |
| Save/load diverges from engine semantics | medium | Test round trips before polish | A saved state cannot resume deterministic simulation |
| Import UX blocks play | medium | Carry Phase 4 error states into shell | User cannot recover from missing/invalid data |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Exact first build interaction — revisit after Phases 3/5/6 — default to the
  smallest action that mutates visible map state.
