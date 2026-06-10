# SB-12-02 — Port Road Pathfinding and Road-Building Mode

- **Project:** serfbound
- **Phase:** 12
- **Status:** backlog
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

- [ ] Pathfinder output matches reference fixtures (routes + costs) on fixture
  maps.
- [ ] A browser user can lay, extend, undo, and complete a road; invalid
  segments are rejected with feedback.
- [ ] Roads render with correct path-mask sprites for slope/direction.

## Test plan

- **Unit:** Pathfinding fixture parity; segment validity tests.
- **Integration / Cypress:** Browser test lays a road via pointer.
- **Manual / device:** Real-data capture of a road network.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference road cost model and validity.
- Browser boundary: modal pointer interaction state.
- .NET reference use: read-only porting reference.
- Phase gate advanced: players shape the settlement.
