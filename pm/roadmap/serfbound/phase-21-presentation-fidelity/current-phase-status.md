# Phase 21 — Presentation Fidelity

**Last updated:** 2026-06-10.
**Status:** in progress — SB-21-01..02 done.

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
- [ ] The canvas renders at native device resolution and the player can
  select view scale; high-DPI screenshots are pixel-sharp. (SB-21-03)
- [ ] Pinch-zoom and two-finger pan work on a touch viewport in e2e.
  (SB-21-04)
- [ ] The visual fidelity gate passes: real-data captures of the fixed
  chrome/text/scales recorded under artifacts. (SB-21-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-21-01 | Authentic frame chrome | done | story-01-authentic-frame-chrome.md | evidence-story-01.md |
| SB-21-02 | Font shadows and text colors | done | story-02-font-shadows-text-colors.md | evidence-story-02.md |
| SB-21-03 | High-resolution rendering and view scales | backlog | story-03-high-resolution-rendering.md | — |
| SB-21-04 | Touch gestures | backlog | story-04-touch-gestures.md | — |
| SB-21-05 | Visual fidelity gate | backlog | story-05-visual-fidelity-gate.md | — |

## Where we are

SB-21-01 and SB-21-02 shipped: the chrome assembles the full four-piece
Box.cs borders with inset interiors, and every game text now draws over
its black font-shadow twin — the real-data captures show the HUD
readable over bright terrain (the launch-review complaint). The color
audit found the reference tints all glyphs one green (#73b343, already
our decoded palette color), so no per-context recoloring exists to port.
Next: SB-21-03 high-resolution rendering and view scales.

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
