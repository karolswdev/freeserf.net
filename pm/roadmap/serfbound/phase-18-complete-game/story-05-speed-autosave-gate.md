# SB-18-05 — Speed, Autosave, and the Played-Mission Gate

- **Project:** serfbound
- **Phase:** 18
- **Status:** done
- **Depends on:** SB-18-04
- **Unblocks:** SB-19-01
- **Owner:** unassigned

## Problem

The completeness gate - original game speed controls, autosave protecting long sessions, and a campaign mission actually played against the AI as recorded evidence.

## Scope

- **In:** Game speed controls (pause through fast-forward) with deterministic tick scaling, periodic autosave to browser storage with rotation, a soak test with memory/tick metrics, played-mission capture evidence.
- **Out:** Performance optimization work (Phase 19).

## Acceptance criteria

- [x] Speed controls match reference tick semantics deterministically.
- [x] Autosave rotates and restores after a forced reload.
- [x] Soak metrics recorded
- [x]  mission-1 playthrough capture reviewed.

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
