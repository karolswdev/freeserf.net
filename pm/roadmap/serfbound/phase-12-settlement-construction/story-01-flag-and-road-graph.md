# SB-12-01 — Port the Flag and Road Graph

- **Project:** serfbound
- **Phase:** 12
- **Status:** done
- **Depends on:** SB-11-05
- **Unblocks:** SB-12-02
- **Owner:** unassigned

## Problem

Everything in Settlers flows over the flag/road graph: flags are nodes, roads
are edges with directions and lengths, and later phases (transporters,
economy, military) all query it. `Freeserf.Core/Flag.cs` + `FlagState.cs`
define the reference semantics.

## Scope

- **In:** Flag entity/state port in `@serfbound/engine`: creation/removal on
  valid positions, road linkage per direction, road merge on flag insertion
  and join on flag removal, path priorities, and graph search primitives;
  oracle fixtures for graph operations.
- **Out:** Pathfinding UX (SB-12-02), resource queues on flags (Phase 13/14).

## Acceptance criteria

- [x] Flag placement validity matches reference rules on fixture maps.
- [x] Splitting a road by placing a flag, and merging by removing one,
  produce reference-equivalent graphs (fixture parity).
- [x] Graph state serializes into the local save snapshot.

## Test plan

- **Unit:** Graph operation fixtures in CI.
- **Integration / Cypress:** n/a until SB-12-02.
- **Manual / device:** n/a.
- **Design handoff:** n/a.

## Notes / open questions

- Preserves: reference graph invariants and direction encoding.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: the settlement's circulatory system exists.
