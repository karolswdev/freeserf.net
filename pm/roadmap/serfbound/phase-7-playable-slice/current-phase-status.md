# Phase 7 — Playable Slice

**Last updated:** 2026-06-09.

**Status:** complete; Phase 8 ready.

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

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] A user can open the browser client, import local data, start a game, and
  see the settlement map.
- [x] One visible build/road/flag interaction mutates engine state and rendered
  output.
- [x] The playable path runs in the browser with no desktop companion process.
- [x] Save/load works in browser persistence and passes at least one round-trip
  test.
- [x] Manual verification steps and screenshots/video are stored as evidence.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-7-01 | Start local game from imported data | done | story-01-start-local-game.md | evidence-story-01.md |
| SB-7-02 | Implement first visible build action | done | story-02-first-visible-build-action.md | evidence-story-02.md |
| SB-7-03 | Add browser save/load loop | done | story-03-browser-save-load-loop.md | evidence-story-03.md |
| SB-7-04 | Verify playable loop manually | done | story-04-playable-loop-verification.md | evidence-story-04.md |

## Where we are

Phase 7 is complete. SB-7-04 executed the browser manual playable-loop script
with local user-provided `SPAU.PA`: import, start, build flag, save, reload,
load, and visual confirmation that the built flag persisted. The phase now
hands off to Phase 8 browser hardening.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| First playable scope balloons into full game parity | high | Keep slice to one visible loop | Stories require late-game economy before basic build works |
| Save/load diverges from engine semantics | medium | Test round trips before polish | A saved state cannot resume deterministic simulation |
| Import UX blocks play | medium | Carry Phase 4 error states into shell | User cannot recover from missing/invalid data |

## Decisions made (this phase)

- 2026-06-09 — A local game start requires imported `SPAU.PA` catalog data.
  Generated preview terrain can still render before import, but it cannot be
  promoted to a running local game — SB-7-01.
- 2026-06-09 — Derive the first local game seed deterministically from imported
  DOS PA catalog metadata until Phase 7 introduces explicit setup options —
  SB-7-01.
- 2026-06-09 — Use flag placement as the first visible build action. Roads,
  huts, terrain/buildability rules, ownership, logistics, and economy effects
  are deferred until later simulation stories; SB-7-02 proves the browser
  UI-engine-render loop only.
- 2026-06-09 — Store Serfbound browser saves separately from original imported
  data. Save records carry `schemaVersion: 1`, imported-data source metadata,
  and a `serfbound.local-game` snapshot; original savegame compatibility stays
  out of scope — SB-7-03.
- 2026-06-09 — Phase 7 manual verification uses a static Vite preview server
  only to serve browser assets during local evidence capture. The playable app
  path remains browser-native and does not use a .NET runtime, desktop shell,
  native launcher, or local companion process — SB-7-04.

## Decisions deferred

- Original placement rules, roads, huts, worker logistics, and economy effects.
- Original savegame import/export compatibility.
- Phase 8 browser hardening: performance budgets, worker strategy, persistence
  recovery, browser compatibility, and accessibility basics.
