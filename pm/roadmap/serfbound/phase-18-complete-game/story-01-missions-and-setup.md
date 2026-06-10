# SB-18-01 — Missions and Game Setup Variants

- **Project:** serfbound
- **Phase:** 18
- **Status:** done
- **Depends on:** SB-17-03
- **Unblocks:** SB-18-02
- **Owner:** unassigned

## Problem

The original campaign is a list of predefined missions - seeds, player setups, supplies, reinforcement levels - in Mission.cs. They must select from the start screen and start exactly right.

## Scope

- **In:** Mission definition port, mission selection UI in the Phase 16 start screen, mission-correct game initialization (players, castles, supplies), random-game variants alongside.
- **Out:** AI behavior (SB-18-02/03) - missions start with AI slots wired but dumb until then.

## Acceptance criteria

- [x] Mission list and parameters match Mission.cs exactly.
- [x] Selecting a mission starts the right map, players, and supplies (fixtures).
- [x] Start screen flows cover campaign and custom games.

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
