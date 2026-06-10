# SB-18-03 — Classic AI Economy and Military Behaviors

- **Project:** serfbound
- **Phase:** 18
- **Status:** done
- **Depends on:** SB-18-02
- **Unblocks:** SB-18-04
- **Owner:** unassigned

## Problem

The substance of AIStates/ - building placement and linking, food/tool/military balancing, attack decisions - so a mission opponent actually plays the game.

## Scope

- **In:** Ports of the AIStates set (build planning, road linking, resource balancing, knight/attack logic) staged by state, seeded-run decision fixtures per state, difficulty/character parameters from missions.
- **Out:** AI rebalancing or new strategies.

## Acceptance criteria

- [x] Each ported state matches reference decision fixtures on seeded runs.
- [x] An AI opponent founds, grows, and attacks in a seeded test game.
- [x] Mission character parameters (aggressiveness etc.) take effect.

## Test plan

- **Unit:** Fixture parity (decisions, saves, missions) in CI.
- **Integration / Cypress:** Browser scenario tests on fixture data.
- **Manual / device:** Real-data/realsave runs recorded as evidence.
- **Design handoff:** Screenshots/captures under phase artifacts.

## Notes / open questions

- Preserves: reference behavior; divergences recorded at ship time.
- Browser boundary: storage quotas for autosave; long-session memory.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
