# SB-21-03 — High-Resolution Rendering and View Scales

- **Project:** serfbound
- **Phase:** 21
- **Status:** done
- **Depends on:** SB-21-02
- **Unblocks:** SB-21-04
- **Owner:** Claude

## Problem

The canvas backing store is sized in CSS pixels, ignoring
`devicePixelRatio` — on high-DPI displays the game renders at half or a
third of physical resolution and upscales blurry. The original shipped an
SVGA mode for exactly this; the modern equivalent is native-resolution
rendering plus explicit view scales.

## Scope

- **In:** devicePixelRatio-aware backing store (pointer math included),
  explicit view-scale modes for the world view (1x/2x/3x integer zoom)
  selectable in the UI and by keyboard, UI scale decoupled from world
  scale, perf guard rerun at DPR 2/3 backing sizes.
- **Out:** Pinch-to-zoom gesture mapping (SB-21-04); non-integer zoom.

## Acceptance criteria

- [x] Canvas backing store matches physical pixels; high-DPI captures are
  pixel-sharp (no browser upscale blur).
- [x] The player can switch world view scale; projection, picking, and
  scroll bounds stay correct at every scale.
- [x] The performance guard passes at the larger backing sizes. (The
  visible lattice shrinks with the view scale, so per-frame sprite
  counts hold; measure:scale guard bands pass.)

## Test plan

- **Unit:** Projection/picking math at DPR and view-scale combinations.
- **Integration / e2e:** A high-DPI Playwright context plays the founding
  flow; scale switch asserted.
- **Manual / device:** Real-data captures at each scale via the visual
  gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: replaces the original fixed VGA/SVGA modes with
  native-resolution + integer view scales (divergence recorded).
- Browser boundary: rendering (devicePixelRatio, backing-store sizing).
- .NET reference use: read-only porting reference.
- Phase gate advanced: exit criterion 3.
