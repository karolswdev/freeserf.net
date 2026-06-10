# SB-14-05 — Full-Economy Gate with Live Stats

- **Project:** serfbound
- **Phase:** 14
- **Status:** backlog
- **Depends on:** SB-14-04
- **Unblocks:** SB-15-01
- **Owner:** unassigned

## Problem

The phase gate - all chains concurrently in one settlement, stats data live, performance measured, captured with real data.

## Scope

- **In:** End-to-end economy scenario (data-free fixture map in CI, real data manually), stats/graph data exposure from Player/Game state, performance measurement, phase close-out.
- **Out:** Stats popup rendering (Phase 16).

## Acceptance criteria

- [ ] All chains run concurrently in one session without deadlock.
- [ ] Stats data (resource counts, production history) updates live.
- [ ] Real-data capture reviewed
- [ ]  performance within baselines.

## Test plan

- **Unit:** Fixture parity for the story's chain/state logic in CI.
- **Integration / Cypress:** Browser scenario test on the fixture archive.
- **Manual / device:** Real-data capture via the standing visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference behavior of the ported systems; intentional
  divergences must be recorded here at ship time.
- Browser boundary: none new expected.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
