# SB-7-02 — Implement First Visible Build Action

- **Project:** serfbound
- **Phase:** 7
- **Status:** backlog
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

- [ ] A player can select a valid map position and trigger the chosen action.
- [ ] Engine state changes through the command route.
- [ ] Rendered output changes visibly.
- [ ] Invalid positions/actions are rejected with recoverable feedback.
- [ ] The chosen action and deferred original-game rules are documented.

## Test plan

- **Unit:** Command/state mutation tests.
- **Integration / Cypress:** Browser action flow test.
- **Manual / device:** Execute the action in a local browser game and capture
  before/after evidence.
- **Design handoff:** Screenshot/video evidence required.

## Notes / open questions

Default action should be the smallest road/flag/building operation that proves
the engine-renderer-UI loop.
