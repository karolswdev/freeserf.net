# Evidence — SB-21-02 — Font Shadows and Text Colors

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/ui-art.ts` — `decodeUiFontShadowGlyph`
  decodes the font-shadow set (resource base 810, same glyph mapping as
  the font) and `tintDecodedSprite` forces visible pixels to a color the
  way the reference tints whole glyph sets (TextureAtlasManager: font
  #73b343, font shadow black). Shadows decode black; the font keeps its
  decoded palette green, which is the reference's #73b343 tint.
- `serfbound/packages/app/src/render-layer-scene.ts` — `rawFontShadows`
  decode into the render assets and both atlases register `uifs:` glyph
  twins; the init-screen text draws shadow-first at the same position.
- `serfbound/packages/app/src/landscape-scene.ts` — the shared
  `pushUiText` helper draws every game text (HUD, popup texts, notices)
  as black shadow + glyph pairs, replacing the three naked-glyph loops.
- `serfbound/tests/ci/app-ui-art.test.mjs` — the shadow set decodes
  black with full glyph coverage; every on-screen glyph has a shadow
  twin at its exact position that sorts beneath it; the landscape atlas
  carries `uifs:` regions.
- `serfbound/tests/browser/mobile-play.spec.ts` — the castle probe grid
  measures the canvas fresh after game start (the status panel shifts
  the layout); fixes a once-in-a-suite flake observed this story.

## Verification artifacts

```text
npm run test:unit -> # tests 174 / pass 174 / fail 0
npm run test:browser -> 9 passed (2.8m)
npm run test:local:assets -> serfbound-local-asset-tests-ok (real SPAU.PA)
npm run capture:local:screenshots ->
  serfbound-local-screenshots-ok: 5349 decoded sprites on screen
```

The refreshed real-data captures under `artifacts/` show the running
game's HUD text ("PLANK:40 STONE:30") clearly readable over green
terrain through the black shadow layer, and the init-screen rows
shadowed the same way — before this story the same text visually
disappeared into the map (the launch-review complaint).

## Deviations from plan

- Text color audit result: the reference tints all font glyphs the
  single color #73b343 (TextureAtlasManager.cs:425) — there is no
  per-context recoloring to port. Our decoded palette glyphs already
  render that green, so the font is left palette-decoded and only the
  shadow set is tinted (black), exactly as the reference does.
- The shadow draws at the glyph's own position (the shadow art carries
  its offset in its pixels), matching the reference's same-offset
  layering.

## Follow-ups

- SB-21-03: devicePixelRatio rendering and view scales.
