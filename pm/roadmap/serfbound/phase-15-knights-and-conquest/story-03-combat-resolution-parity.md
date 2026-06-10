# SB-15-03 — Port Combat Resolution with Parity Fixtures

- **Project:** serfbound
- **Phase:** 15
- **Status:** done
- **Depends on:** SB-15-02
- **Unblocks:** SB-15-04
- **Owner:** unassigned

## Problem

Attacks send knights out of buildings to fight at flags - a deterministic state dance in Serf.cs with seeded outcomes. Port it exactly, and render it with authentic fight animations.

## Scope

- **In:** Attack initiation from Player.cs (selecting buildings/knight counts), knight fight states, seeded combat resolution, fight animation rendering, defender replacement logic.
- **Out:** Capture consequences (SB-15-04).

## Acceptance criteria

- [x] Seeded combat outcome fixtures match the reference exactly.
- [x] Fight animations render at the contested flag.
- [x] Knight losses update occupancy and morale correctly.

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
