# Phase 12 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The founding loop works end-to-end in the browser with original rules:
castle placement and territory, the flag/road graph with reference
merge/split semantics, A* road pathfinding at reference costs, authentic
road/building/border rendering, and construction stages on the game clock —
all persisted through save/load by replaying the world-action log.

## Exit criteria — final state

- [x] Flag/road graph with reference merge/split and path costs (SB-12-01/02).
- [x] Castle placement, territory claim, rendered borders (SB-12-03).
- [x] Construction stage progression with authentic sprites (SB-12-04).
- [x] End-to-end founding in the browser with real-data evidence (SB-12-05).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-12-01 | Port the flag and road graph | evidence-story-01.md |
| SB-12-02 | Port road pathfinding and road-building mode | evidence-story-02.md |
| SB-12-03 | Place the castle and claim territory | evidence-story-03.md |
| SB-12-04 | Construct buildings with progress sprites | evidence-story-04.md |
| SB-12-05 | Found a settlement end-to-end | evidence-story-05.md |

## What the phase intentionally did not do

- Serf-driven construction (interim time-stepped path is flagged for
  deletion in SB-13-04).
- Border sprite selection refinement (RenderBorderSegment port pending).
- Full build menus (Phase 16); military/mine building UI.

## Carry-forward recommendations

1. SB-13-04 must delete `advanceConstruction`'s time-stepped model.
2. The world-action replay pattern extends naturally to serf state — keep
   actions as the canonical save format.
3. Border/road sprite refinement can ride along with Phase 15 borders work.
