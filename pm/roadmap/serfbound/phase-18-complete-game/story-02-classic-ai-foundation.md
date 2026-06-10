# SB-18-02 — Classic AI Foundation

- **Project:** serfbound
- **Phase:** 18
- **Status:** done
- **Depends on:** SB-18-01
- **Unblocks:** SB-18-03
- **Owner:** unassigned

## Problem

AI.cs drives computer players through a state machine (AIStates/) making periodic decisions. This story ports the skeleton - scheduling, state transitions, decision recording - so behaviors can land verifiably.

## Scope

- **In:** AI player loop and tick scheduling, AIState base machinery and transition order, decision-recording instrumentation for fixture comparison, castle placement state as the first working decision.
- **Out:** Economy/military AI states (SB-18-03).

## Acceptance criteria

- [x] AI state transitions match reference traces on seeded runs.
- [x] AI places its castle matching reference fixture decisions.
- [x] Decision logs are capturable for fixtures.

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
