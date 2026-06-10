# Phase 21 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The game now looks right on real screens, and every item of the
launch-review punch list is fixed with evidence: popups, the init box,
and notifications assemble the exact four-piece reference frame with
inset interiors (the misplaced bottom bar is gone); every game text
draws over the original black font-shadow layer and reads clearly over
bright terrain; the canvas renders at native device resolution with
player-selectable 1x/2x/3x world view scales (the modern SVGA),
defaulting to the screen's pixel density; and touch play gained real
gestures — pinch-zoom onto the view scales, two-finger pan, and
long-press inspect — without disturbing single-finger flows.

## Exit criteria — final state

- [x] Four-piece borders with inset interiors; init box and panel bar
  audited against the reference definitions (SB-21-01).
- [x] Font shadows under every text; readability proven in real-data
  captures (SB-21-02).
- [x] Native-resolution rendering with selectable view scales; high-DPI
  captures pixel-sharp (SB-21-03).
- [x] Pinch-zoom and two-finger pan in e2e on the phone profile
  (SB-21-04).
- [x] Visual fidelity gate: all standing gates green at the closing
  commit with refreshed real-data captures (SB-21-05).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-21-01 | Authentic frame chrome | evidence-story-01.md |
| SB-21-02 | Font shadows and text colors | evidence-story-02.md |
| SB-21-03 | High-resolution rendering and view scales | evidence-story-03.md |
| SB-21-04 | Touch gestures | evidence-story-04.md |
| SB-21-05 | Visual fidelity gate | evidence-story-05.md |

## Decisions and honest records

- The reference tints all font glyphs one green (#73b343) — there is no
  per-context text recoloring to port; readability comes from the
  shadow layer, exactly as the original did it.
- The original's fixed VGA/SVGA modes became native-resolution + integer
  view scales; fractional DPRs round to integer art scales.
- Touch taps act on pointerup (12px slop) so a gesture's first finger
  cannot fire build actions — a real pre-existing hazard (pinching on a
  fresh game could place the castle).
- The condensed 144x128 init box crops the 8x144 side pieces to its
  112px interior.
- Suite growth this phase: 171→181 unit tests, 9→10 browser suites
  (high-DPI), with gestures added to the mobile e2e.

## What's next

Phase 22 — multiplayer foundations: per-tick determinism checksums,
the lockstep session core, the versioned wire protocol, and the
two-tab loopback game, per the SB-20-04 transport decision.
