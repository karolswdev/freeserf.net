# SB-15-02 — Military Occupation and Border Growth

- **Project:** serfbound
- **Phase:** 15
- **Status:** done
- **Depends on:** SB-15-01
- **Unblocks:** SB-15-03
- **Owner:** unassigned

## Problem

Huts, towers, and fortresses request knights, and occupied buildings project territory. Borders must grow, merge, and shrink exactly as the reference computes them.

## Scope

- **In:** Military building types with occupancy requests/settings, knight walk-to-post states, territory recomputation on occupation change, border re-rendering, knight occupancy settings.
- **Out:** Attacks (SB-15-03).

## Acceptance criteria

- [x] Occupancy requests/fill match reference fixtures.
- [x] Territory growth on occupation matches border fixtures.
- [x] Borders re-render correctly on every change.

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
