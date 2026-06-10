# SB-6-04 — Verify Interaction Ergonomics

- **Project:** serfbound
- **Phase:** 6
- **Status:** done
- **Depends on:** SB-6-01, SB-6-02, SB-6-03
- **Unblocks:** SB-7-04, SB-8-04
- **Owner:** unassigned

## Problem

The browser shell must feel usable before we declare the first playable slice.
This story checks whether core interactions are discoverable, responsive, and
not fighting browser defaults.

## Scope

- **In:** Manual interaction script, shortcut/browser-conflict review,
  pointer-feedback review, basic touch/trackpad notes, and fixes for blocking
  ergonomics issues.
- **Out:** Full UX research, final visual design, accessibility completion, or
  complete original shortcut parity.

## Acceptance criteria

- [ ] Manual interaction script exists.
- [ ] Browser shortcut conflicts are documented with substitutions or deferrals.
- [ ] Pointer feedback is clear enough for Phase 7 actions.
- [ ] Blocking ergonomics issues are fixed or explicitly stop Phase 7.
- [ ] Evidence includes browser/version and input device notes.

## Test plan

- **Unit:** n/a unless interaction helpers change.
- **Integration / Cypress:** Optional smoke checks for critical interactions.
- **Manual / device:** Execute the interaction script with mouse, trackpad, and
  touch where available.
- **Design handoff:** Screenshot/video evidence if UI changed.

## Notes / open questions

Shipped `manual-interaction-script.md`, `shortcut-conflict-review.md`, and
`interaction-ergonomics-audit.md`. Chromium browser checks passed for
mouse-style pointer, trackpad-equivalent pointer path, touch-style PointerEvent
boundary, import recovery, start-game state, selected tile feedback, and
desktop/mobile layout. No Phase 7 blocking ergonomics issue was found.

This is the first place to be honest about whether the browser version is
actually playable, not just technically wired.
