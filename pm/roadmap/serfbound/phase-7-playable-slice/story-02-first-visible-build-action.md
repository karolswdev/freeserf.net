# SB-7-02 — Implement First Visible Build Action

- **Project:** serfbound
- **Phase:** 7
- **Status:** done
- **Depends on:** SB-7-01, SB-6-02, SB-6-01
- **Unblocks:** SB-7-04
- **Owner:** unassigned

## Problem

A playable slice needs one meaningful player action that changes both engine
state and the rendered map. Without this, Serfbound is only a viewer.

## Scope

- **In:** One small build/road/flag interaction, command validation, state
  mutation, render update, and verification against known engine assumptions.
- **Out:** Full building catalog, complete economy, worker logistics, combat, or
  AI behavior.

## Acceptance criteria

- [x] A player can select a valid map position and trigger the chosen action.
- [x] Engine state changes through the command route.
- [x] Rendered output changes visibly.
- [x] Invalid positions/actions are rejected with recoverable feedback.
- [x] The chosen action and deferred original-game rules are documented.

## Test plan

- **Unit:** Command/state mutation tests.
- **Integration / Cypress:** Browser action flow test.
- **Manual / device:** Execute the action in a local browser game and capture
  before/after evidence.
- **Design handoff:** Screenshot/video evidence required.

## Notes / open questions

The chosen action is `game.build` with `building: "flag"`. This is the smallest
visible settlement action that proves UI command routing, engine mutation, and
render feedback without pulling in the full road graph, worker logistics,
building catalog, or economy.

Deferred original-game rules:

- Roads and huts are accepted command vocabulary but reject with
  `build-command-deferred`.
- Occupied target tiles reject with `tile-occupied` and recoverable browser
  feedback.
- Original placement rules, terrain/buildability checks, ownership, serf
  assignment, stock routing, and economy effects remain future simulation work.
