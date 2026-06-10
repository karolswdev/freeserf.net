# SB-12-04 — Construct Buildings with Progress Sprites

- **Project:** serfbound
- **Phase:** 12
- **Status:** done
- **Depends on:** SB-12-03
- **Unblocks:** SB-12-05
- **Owner:** unassigned

## Problem

Buildings in Settlers visibly grow: site leveling, frame stage, then the
finished sprite, driven by material deliveries and builder work. This story
ports the building lifecycle and renders it authentically; actual serf labor
arrives in Phase 13.

## Scope

- **In:** Building entity/state port (`Building.cs` lifecycle: planned →
  leveling → frame → done) for an initial building set (hut-sized + one
  larger), material requirements, interim time-stepped progress (explicitly
  flagged until Phase 13), and rendering of construction-stage sprites with
  shadows from the decoded atlas.
- **Out:** Production behavior (Phase 14), military occupation (Phase 15).

## Acceptance criteria

- [x] Building placement validity (terrain/space per size) matches fixtures.
- [x] Construction progresses through reference stages with the correct
  sprite at each stage.
- [x] Completed buildings persist through save/load.

## Test plan

- **Unit:** Lifecycle state fixtures; placement validity tests.
- **Integration / Cypress:** Browser test queues a building and observes
  stage data attributes.
- **Manual / device:** Real-data capture of construction stages.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Intentionally diverges (temporarily): progress is time-stepped, not
  serf-driven, until Phase 13 — recorded as an explicit interim.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: settlements visibly grow.
