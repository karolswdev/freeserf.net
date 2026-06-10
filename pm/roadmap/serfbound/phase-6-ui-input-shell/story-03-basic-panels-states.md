# SB-6-03 — Build Basic Panels And States

- **Project:** serfbound
- **Phase:** 6
- **Status:** done
- **Depends on:** SB-2-04, SB-4-04, SB-6-02
- **Unblocks:** SB-7-01, SB-7-02, SB-7-04
- **Owner:** unassigned

## Problem

The first playable slice needs enough UI to import data, start a game, inspect
state, and trigger the first interaction. It does not need full original UI
parity yet.

## Scope

- **In:** Minimal import state, start-game state, game HUD/status surface,
  selected tile/action panel, and error states.
- **Out:** Full menu parity, all building panels, tutorial flow, multiplayer UI,
  final visual design, or broad accessibility audit.

## Acceptance criteria

- [ ] UI has explicit states for missing data, imported data, running game, and
  recoverable error.
- [ ] A start-game path is visible and testable.
- [ ] A selected map position can be represented in the UI.
- [ ] Panels fit supported desktop/mobile viewports without incoherent overlap.
- [ ] UI text does not describe implementation details to players.

## Test plan

- **Unit:** State reducer/component tests if applicable.
- **Integration / Cypress:** Browser state-flow smoke test.
- **Manual / device:** Check desktop and mobile viewport layout.
- **Design handoff:** Screenshot evidence for first playable UI shell.

## Notes / open questions

Shipped player-facing Data, Game, Map, Hover, Selected Tile, and Action panels.
The shell now exposes missing data, imported data, running game, and recoverable
file-error states, with a visible `Start game` path and desktop/mobile
screenshot evidence.

Use restrained operational UI. This is a game tool surface, not a marketing
page.
