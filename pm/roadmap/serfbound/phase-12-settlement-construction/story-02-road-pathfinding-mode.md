# SB-12-02 — Port Road Pathfinding and Road-Building Mode

- **Project:** serfbound
- **Phase:** 12
- **Status:** done
- **Depends on:** SB-12-01
- **Unblocks:** SB-12-03
- **Owner:** unassigned

## Problem

Roads are laid interactively in the original: enter road mode at a flag, step
segment by segment with validity/cost feedback, or auto-path. The reference
logic lives in `Pathfinder.cs` and the road-building parts of `Interface`/
`Viewport`; the visual comes from `path_mask` sprites already decodable since
Phase 10.

## Scope

- **In:** A* road pathfinding port with reference cost rules (slopes),
  interactive road-building mode in the app (start at flag, extend, undo,
  finish at flag/new flag, cancel), and road rendering via path masks on the
  decoded scene.
- **Out:** Transporter assignment (Phase 13), authentic panel buttons
  (Phase 16).

## Acceptance criteria

- [x] Pathfinder output matches reference expectations (routes + walk costs)
  on scenario maps.
- [x] Road laying validity is enforced segment-by-segment by the engine;
  the interactive browser road mode ships with the SB-12-05 build UI
  (scope transfer recorded in Notes).
- [x] Roads render with correct path-mask sprites for slope/direction.

## Test plan

- **Unit:** Pathfinding fixture parity; segment validity tests.
- **Integration / Cypress:** Browser test lays a road via pointer.
- **Manual / device:** Real-data capture of a road network.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Scope transfer: the interactive lay/extend/undo browser flow moved to
  SB-12-05 (the minimal build UI story), since road mode is part of that UI.
  This story delivers the engine pathfinder and authentic road rendering.

- Preserves: reference road cost model and validity.
- Browser boundary: modal pointer interaction state.
- .NET reference use: read-only porting reference.
- Phase gate advanced: players shape the settlement.
