# SB-6-01 — Implement Pointer-To-Map Interaction

- **Project:** serfbound
- **Phase:** 6
- **Status:** ready
- **Depends on:** SB-5-02, SB-5-04, SB-3-02
- **Unblocks:** SB-6-02, SB-7-02
- **Owner:** unassigned

## Problem

Players interact with the game by pointing at map locations. Serfbound must
translate browser pointer events into deterministic map positions before game
commands can be trusted.

## Scope

- **In:** Pointer event handling, screen/view/map conversion, hover/selection
  debug state, tests, and mouse/trackpad/touch exploratory checks.
- **Out:** Full command routing, all shortcut handling, final UI panels, or
  gameplay action implementation.

## Acceptance criteria

- [ ] Pointer positions map to engine coordinates through tested helpers.
- [ ] Hover or selection debug feedback proves mapping in the browser.
- [ ] Resize and scroll offsets are handled or explicitly deferred.
- [ ] Touch/trackpad viability is manually assessed.
- [ ] Mapping does not duplicate projection math from Phase 5.

## Test plan

- **Unit:** Coordinate conversion tests.
- **Integration / Cypress:** Browser pointer event smoke test.
- **Manual / device:** Mouse, trackpad, and touch exploratory check.
- **Design handoff:** n/a - interaction primitive.

## Notes / open questions

Do not wire destructive commands until selection behavior is trustworthy.
