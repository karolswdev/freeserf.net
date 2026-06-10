# SB-12-03 — Place the Castle and Claim Territory

- **Project:** serfbound
- **Phase:** 12
- **Status:** done
- **Depends on:** SB-12-02
- **Unblocks:** SB-12-04
- **Owner:** unassigned

## Problem

The game starts with castle placement: a validity-checked, one-time act that
claims initial territory and seeds the player's stock. Territory borders must
render (border markers/stakes) so ownership is visible.

## Scope

- **In:** Castle placement rules, initial territory claim radius and border
  computation from `Game.cs`/`Player.cs`, initial castle inventory seeding,
  castle sprite rendering, and border marker rendering on the decoded scene.
- **Out:** Territory growth from military buildings (Phase 15), inventory
  behavior (Phase 14).

## Acceptance criteria

- [x] Castle placement validity matches reference rules (terrain, space,
  distance from edge) on fixture maps.
- [x] Territory claim matches a reference fixture; borders render visibly.
- [x] The start-game flow requires castle placement before other actions.

## Test plan

- **Unit:** Placement validity + territory fixtures.
- **Integration / Cypress:** Browser test places a castle and asserts state.
- **Manual / device:** Real-data capture with castle and borders.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference start conditions and supplies settings hook.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: the player exists on the map.
