# SB-15-01 — Arm and Recruit Knights

- **Project:** serfbound
- **Phase:** 15
- **Status:** done
- **Depends on:** SB-14-05
- **Unblocks:** SB-15-02
- **Owner:** unassigned

## Problem

Knights need swords and shields from the weaponsmith and morale from gold reserves. This story closes the economy into military supply and staffs the castle with knights.

## Scope

- **In:** Weaponsmith chain, gold smelting and morale math from Player.cs, knight recruitment from generic serfs with weapons, knight ranks and castle knight stock.
- **Out:** Occupation (SB-15-02), combat (SB-15-03).

## Acceptance criteria

- [x] Weapon/shield production matches reference fixtures.
- [x] Gold morale computation matches Player.cs fixtures.
- [x] Knights recruit per reference gating (serf + sword + shield).

## Test plan

- **Unit:** Fixture parity for the story's combat/territory logic in CI.
- **Integration / Cypress:** Browser scenario test on the fixture archive.
- **Manual / device:** Real-data capture via the standing visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference behavior; intentional divergences recorded at
  ship time.
- Browser boundary: none new expected.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
