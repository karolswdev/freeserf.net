# SB-12-05 — Found a Settlement End-to-End

- **Project:** serfbound
- **Phase:** 12
- **Status:** done
- **Depends on:** SB-12-04
- **Unblocks:** SB-13-01
- **Owner:** unassigned

## Problem

The phase gate: a browser user founds a settlement — castle, roads, first
buildings — through a coherent (if minimal) interaction loop, on the
generated world, with everything saved and restored.

## Scope

- **In:** Minimal build interaction UI (select position → valid actions:
  flag/road/building from a small set), wiring all Phase 12 systems into the
  command router and save/load, and the end-to-end proof with real data.
- **Out:** Authentic panel/popups (Phase 16), serf labor (Phase 13).

## Acceptance criteria

- [x] Browser flow works end-to-end: place castle → lay road → place hut →
  construction completes → save → reload → load → state intact.
- [x] All commands route through the deterministic command router.
- [x] Real-data screenshots of the founded settlement recorded as evidence;
  data-free browser test covers the same flow on the fixture archive.

## Test plan

- **Unit:** Command-routing tests for new commands.
- **Integration / Cypress:** Full founding flow in Playwright.
- **Manual / device:** Real-data capture run.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: original founding sequence semantics.
- Browser boundary: none new beyond prior stories.
- .NET reference use: none directly.
- Phase gate advanced: closes Phase 12.
