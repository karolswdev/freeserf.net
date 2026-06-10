# SB-14-01 — Port Inventories and Resource Distribution

- **Project:** serfbound
- **Phase:** 14
- **Status:** done
- **Depends on:** SB-13-05
- **Unblocks:** SB-14-02
- **Owner:** unassigned

## Problem

Castle and stock buildings hold serfs and resources; distribution priorities and serf-to-building assignment decide what moves where. Ports Inventory.cs and the Player.cs distribution/priority tables.

## Scope

- **In:** Inventory state, serf/resource stock, distribution priority tables and their effects, stock building behavior, demolition returning resources.
- **Out:** Production chains (later stories), stats UI (Phase 16).

## Acceptance criteria

- [x] Inventory operations match reference expectations (the supplies preset
  template interpolation verified against the reference fixed-point math).
- [x] Stock gating measurably affects logistics (construction draws planks/
  stones from the castle; empty stocks refuse serfs and resources).
  Distribution priority sliders transfer to the chain stories where multiple
  consumers compete (scope note below).
- [x] Inventory state derives from the deterministic action replay
  (consumption is replayed with the actions that caused it).

## Test plan

- **Unit:** Fixture parity for the story's chain/state logic in CI.
- **Integration / Cypress:** Browser scenario test on the fixture archive.
- **Manual / device:** Real-data capture via the standing visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Scope transfer: player-adjustable distribution priorities require multiple
  competing consumers and the settings UI; they land across SB-14-02..05 and
  Phase 16's settings popups.

- Preserves: reference behavior of the ported systems; intentional
  divergences must be recorded here at ship time.
- Browser boundary: none new expected.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
