# SB-21-05 — Visual Fidelity Gate

- **Project:** serfbound
- **Phase:** 21
- **Status:** done
- **Depends on:** SB-21-04
- **Unblocks:** SB-22-01
- **Owner:** Claude

## Problem

The phase's fixes must be proven the way they were found: by looking.
The standing visual gate captures real-data screenshots; this story
closes the phase on chrome, text, scale, and gesture evidence.

## Scope

- **In:** Refreshed real-data captures (popups with full borders,
  shadowed text over terrain, each view scale, high-DPI sharpness),
  regenerated shell screenshots where the fixes legitimately change
  them, full gate rerun (unit, browser, boundaries, docs, perf guard),
  phase final summary.
- **Out:** New features.

## Acceptance criteria

- [x] Real-data captures under phase artifacts show the corrected chrome,
  readable text, and sharp scales.
- [x] All standing gates pass at the closing commit.
- [x] The phase final summary records deviations honestly.

## Test plan

- **Unit:** Full CI suite rerun.
- **Integration / e2e:** Full browser suite rerun.
- **Manual / device:** `npm run capture:local:screenshots` refresh.
- **Design handoff:** Artifact set under the phase folder.

## Notes / open questions

- Preserves: the Phase 10 standing visual-gate rule.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 5 (phase close).
