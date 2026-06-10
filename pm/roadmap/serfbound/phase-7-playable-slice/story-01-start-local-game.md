# SB-7-01 — Start Local Game From Imported Data

- **Project:** serfbound
- **Phase:** 7
- **Status:** done
- **Depends on:** SB-3-03, SB-4-04, SB-5-03, SB-6-03
- **Unblocks:** SB-7-02, SB-7-03, SB-7-04
- **Owner:** unassigned

## Problem

The first playable slice starts when local data, engine state, renderer, and UI
work together. Serfbound needs a start-game path that proves those pieces can
form one browser flow.

## Scope

- **In:** Local data presence check, new-game initialization, map state creation,
  first render of running game state, and failure recovery.
- **Out:** Full game setup options, AI completeness, multiplayer, campaign flow,
  or final menu parity.

## Acceptance criteria

- [ ] User can import or reuse local data and start a local game in browser.
- [ ] Engine state initializes deterministically from selected settings.
- [ ] Renderer displays the initialized map state.
- [ ] Missing/invalid data returns to a recoverable state.
- [ ] No desktop companion or .NET runtime is required.

## Test plan

- **Unit:** New-game initialization tests.
- **Integration / Cypress:** Browser start-game flow using generated fixtures
  where possible.
- **Manual / device:** Start a game with local `SPAU.PA`.
- **Design handoff:** Screenshot/video evidence of started game.

## Notes / open questions

Shipped deterministic local game initialization through
`startSerfboundLocalGame()` in `@serfbound/engine`. The browser start path now
requires imported `SPAU.PA` catalog data, starts a local single-player session,
replaces the command router with the initialized game state, and displays a
settlement map state with screenshot evidence.

Keep setup options minimal. The first goal is a working local path, not a full
original setup screen.
