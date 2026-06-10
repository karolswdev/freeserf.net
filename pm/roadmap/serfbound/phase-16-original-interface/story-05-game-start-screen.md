# SB-16-05 — Authentic Game Start Screen

- **Project:** serfbound
- **Phase:** 16
- **Status:** done
- **Depends on:** SB-16-04
- **Unblocks:** SB-17-01
- **Owner:** unassigned

## Problem

GameInitBox is the original front door - choose game type, seed, players - and Serfbound still starts games from a debug-ish button. The authentic start screen completes the look-and-drive-like-the-original goal.

## Scope

- **In:** Start screen with decoded art (logo, frames), custom-game setup (map size, seed, player slots/colors), player-slot UI, handoff into the running game, asset-import flow integration before first start.
- **Out:** Mission content (Phase 18 adds missions to this screen), multiplayer lobby.

## Acceptance criteria

- [x] Start screen renders authentically and starts seeded custom games.
- [x] Player slots configure color/supplies per reference options (supplies
  + seed for the single local slot; colors/multi-slot recorded for Phase 18).
- [x] Import-then-play first-run flow captured with real data.

## Test plan

- **Unit:** Layout/state logic tests in CI.
- **Integration / Cypress:** Browser tests drive the UI via testids.
- **Manual / device:** Real-data screenshot comparison vs original layouts.
- **Design handoff:** Screenshots under phase artifacts (required - UI story).

## Notes / open questions

- Preserves: original layouts and behavior; browser-native
  reimplementation, not a widget-for-widget port.
- Browser boundary: DOM/canvas UI composition over WebGL.
- .NET reference use: UI/ layer read as layout/behavior reference.
- Phase gate advanced: see phase exit criteria.
