# SB-13-04 — Builders and Diggers Construct Buildings

- **Project:** serfbound
- **Phase:** 13
- **Status:** done
- **Depends on:** SB-13-03
- **Unblocks:** SB-13-05
- **Owner:** unassigned

## Problem

Phase 12 faked construction with a timer. The real flow: a digger levels the
site, materials arrive by transporter, and a builder hammers the building
through its frame stages. This story deletes the interim path.

## Scope

- **In:** Digger (leveling) and builder states with their animations,
  material-gated construction progress, and removal of the Phase 12 interim
  time-step flag.
- **Out:** Professions beyond construction (Phase 14).

## Acceptance criteria

- [x] Construction only progresses with delivered materials and builder work,
  matching reference fixtures.
- [x] Digger/builder animations render at sites.
- [x] The interim construction path is removed (greenfield discipline).

## Test plan

- **Unit:** Construction progression fixtures.
- **Integration / Cypress:** Browser test builds a hut serf-driven.
- **Manual / device:** Real-data capture of a build in progress.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference construction gating.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: settlements grow through labor, as designed.
