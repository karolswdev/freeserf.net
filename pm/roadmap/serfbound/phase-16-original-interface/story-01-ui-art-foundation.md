# SB-16-01 — Render Decoded UI Art - Fonts, Icons, Frames, Cursors

- **Project:** serfbound
- **Phase:** 16
- **Status:** done
- **Depends on:** SB-15-04
- **Unblocks:** SB-16-02
- **Owner:** unassigned

## Problem

Authentic chrome needs the decoded font glyphs, icon sheet, frame borders, and cursor sprites rendered crisply at modern resolutions - the foundation every other UI story builds on.

## Scope

- **In:** Font glyph rendering (decoded font/font_shadow resources) with a text layout helper, icon/frame atlas integration, cursor rendering, integer-scaling decision for pixel art, UI render layer above the map scene.
- **Out:** Specific panels/popups (later stories).

## Acceptance criteria

- [x] Text renders pixel-correct with the decoded font at 1x/2x scales.
- [x] Icons, frames, and the cursor render from decoded art.
- [x] A scaling decision is recorded with visual comparisons.

## Test plan

- **Unit:** Layout/state logic tests in CI.
- **Integration / Cypress:** Browser tests drive the UI via testids.
- **Manual / device:** Real-data screenshot comparison vs original layouts.
- **Design handoff:** Screenshots under phase artifacts (required - UI story).

## Notes / open questions

- Preserves: original layouts and behavior; browser-native
  reimplementation, not a widget-for-widget port.
- Browser boundary: DOM/canvas UI composition over WebGL.
- .NET reference use: UI/ layer read as layout/behavior reference.
- Phase gate advanced: see phase exit criteria.
