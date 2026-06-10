# SB-13-02 — Port the Serf State Machine Core

- **Project:** serfbound
- **Phase:** 13
- **Status:** done
- **Depends on:** SB-13-01
- **Unblocks:** SB-13-03
- **Owner:** unassigned

## Problem

Every serf is a state machine ticked by the game loop. The core states —
idle in stock, walking (free and on paths), entering/leaving buildings,
waiting/transition — underpin every profession. This is the first staged cut
of `Serf.cs`.

## Scope

- **In:** Serf entity/state model, spawn from castle, the walking/pathing
  states with reference step timing and animation selection, scheduling into
  the game tick, and state-machine oracle fixtures.
- **Out:** Transport logic (SB-13-03), construction (SB-13-04), professions
  (Phase 14), fighting (Phase 15).

## Acceptance criteria

- [x] Serf tick sequences match reference fixtures for walk scenarios
  (state, position, animation id per tick).
- [x] Serfs render at correct positions/frames while walking on the decoded
  scene.
- [x] Serf state serializes into save snapshots.

## Test plan

- **Unit:** Tick-sequence fixture parity in CI.
- **Integration / Cypress:** Browser test observes a serf walking.
- **Manual / device:** Real-data visual check.
- **Design handoff:** Short capture/screenshot as evidence.

## Notes / open questions

- Preserves: reference tick cadence and state transition order.
- Browser boundary: continuous render loop now driven by sim ticks.
- .NET reference use: read-only porting reference.
- Phase gate advanced: living creatures on the map.
