# Phase 21 — Presentation Fidelity

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

## Goal

Make the delivered game look right on real screens: frame chrome assembled
exactly like the reference, readable text via the original font-shadow
layer, sharp high-resolution rendering with SVGA-style view scales, and
real touch gestures — fixing the launch-review punch list (misaligned
popup borders, low-contrast text, blurry rendering on high-DPI displays).

## Scope

- **In:** Four-piece popup/notification border assembly per
  `Freeserf.Core/UI/Box.cs` (top 144x9, left/right 8x144, bottom 144x7,
  inset interiors), init-box FrameTop chrome audit, panel-bar piece
  alignment audit, decoding and drawing the font-shadow sprite set
  (resource base 810) under every glyph, reference text-color usage,
  devicePixelRatio-aware canvas backing store, explicit view-scale modes
  (the modern SVGA: 1x/2x/3x world zoom), pinch-zoom and two-finger pan,
  and a screenshot-evidence visual gate from real local data.
- **Out:** Camera-based hand tracking (recorded as a novelty, not a play
  mode); multiplayer (Phase 22+); new UI features beyond fidelity fixes.

## Non-negotiable constraints

- Chrome geometry comes from the reference definitions, not eyeballing:
  border piece sizes/positions match `UI/Box.cs` and the popup interior
  offsets by the border thickness.
- High-DPI work may not regress the Phase 19 scale baselines; the
  performance guard reruns with the new backing-store sizes.
- The asset boundary holds: all new chrome decodes from the player's own
  data at runtime.

## Exit criteria (evidence required)

- [x] Popups and notifications draw the full four-piece border with inset
  interiors; init box and panel bar chrome audited against the reference
  definitions. (SB-21-01)
- [x] Every UI text draws over its font-shadow glyphs; readability holds
  over terrain in real-data captures. (SB-21-02)
- [x] The canvas renders at native device resolution and the player can
  select view scale; high-DPI screenshots are pixel-sharp. (SB-21-03)
- [x] Pinch-zoom and two-finger pan work on a touch viewport in e2e.
  (SB-21-04)
- [x] The visual fidelity gate passes: real-data captures of the fixed
  chrome/text/scales recorded under artifacts. (SB-21-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-21-01 | Authentic frame chrome | done | story-01-authentic-frame-chrome.md | evidence-story-01.md |
| SB-21-02 | Font shadows and text colors | done | story-02-font-shadows-text-colors.md | evidence-story-02.md |
| SB-21-03 | High-resolution rendering and view scales | done | story-03-high-resolution-rendering.md | evidence-story-03.md |
| SB-21-04 | Touch gestures | done | story-04-touch-gestures.md | evidence-story-04.md |
| SB-21-05 | Visual fidelity gate | done | story-05-visual-fidelity-gate.md | evidence-story-05.md |

## Where we are

The phase is closed: every launch-review punch-list item fixed with
evidence, all standing gates green at the closing commit (181/181 unit,
10/10 browser, boundaries, static hosting, docs, real-data sweep, scale
guard), and refreshed real-data captures at DPR 1 and DPR 2 under
artifacts. See final-summary.md. Next: Phase 22 multiplayer
foundations.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Frame piece indices differ across archive versions | medium | Decode-time size checks against Box.cs definitions | A piece decodes at an unexpected size |
| DPR backing stores blow the perf baselines | medium | Rerun the scale guard at DPR 2/3 | Tick or scene-build regression beyond guard bands |
| Gesture handling fights drag-scroll | medium | Pointer-count state machine with e2e coverage | Single-finger scroll regressions |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Camera-based hand-gesture input (novelty track, post-phase decision).
