# Evidence — SB-16-01 — Render Decoded UI Art: Fonts, Icons, Frames, Cursors

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/ui-art.ts` — UI art decoding per the
  `DataSourceDos` resource table (font 750, font shadow 810, icon 870,
  panel buttons 1750, popup frames 660, cursor 3999, all on palette 3);
  `mapCharacterToGlyphIndex` is the exact
  `TextRenderer.MapCharacterToSpriteIndex` port (A–Z/a–z, umlauts, digits
  at 29+, punctuation, invalid prints `?`); `layoutUiText` lays glyphs on
  the legacy 8-pixel advance with spaces skipping.
- `serfbound/packages/app/src/render-layer-scene.ts` — a `ui` render
  layer above the map (`renderLayerOrder` + sprite `scale` for integer
  pixel-art scaling in the WebGL quad path, NEAREST-filtered);
  `DecodedRenderAssets` carries decoded font glyphs, the icon sheet,
  panel buttons, popup frames, and the cursor.
- `serfbound/packages/app/src/landscape-scene.ts` — UI sprites land in
  the runtime atlas (`uif:/uii:/uip:/uifr:/uic` keys) and the scene draws
  the foundation chrome at 2x: a stock line in the decoded game font, an
  icon, a popup frame piece, and the cursor, all in screen space above
  the world; `uiGlyphCount`/`uiIconCount` reported on the assets.
- `serfbound/packages/app/src/main.ts` — `data-serfbound-ui-art`
  publishes the decoded chrome counts.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — the
  CI fixture archive now defines the UI entries (44 glyphs + shadows,
  20 icons, 4 frame pieces, 5 panel buttons, the cursor; entry table
  widened to 4000).
- `serfbound/tests/ci/app-ui-art.test.mjs` — glyph-mapping fixtures,
  text-layout spacing, decode counts, atlas keys, and the 2x ui overlay
  sorting above every map sprite.
- `serfbound/tests/ci/app-render-layer-scene.test.mjs`,
  `serfbound/tests/browser/static-shell.spec.ts`,
  `serfbound/scripts/test-local-assets.mjs` — layer-count expectations
  follow the new `ui` layer.

## Verification artifacts

```text
node --test tests/ci/app-ui-art.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 130 / pass 130 / fail 0
npm run test:browser -> 6 passed (1.6m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run test:local:assets
  -> serfbound-local-asset-tests-ok (real SPAU.PA decode)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5213 decoded sprites; saved
     artifacts/sb-16-01-import-preview-desktop.png,
     artifacts/sb-16-01-import-preview-canvas.png,
     artifacts/sb-16-01-running-game-desktop.png
```

Real-data review: the running-game capture shows `PLANK:40 STONE:20`
rendered in the original DOS game font over the live map, with a decoded
icon at its left, a popup-frame piece below, and the decoded cursor at
the top right — all from the player's own `SPAU.PA`.

## Scaling decision (recorded)

UI chrome renders at **2x integer scale** through the existing
NEAREST-filtered WebGL quad path (a `scale` field on sprite primitives).
1x stays available (the same sprites at scale 1); non-integer scaling is
rejected to keep pixel art crisp. Compared visually in the capture: 2x
glyphs stay sharp with no resampling artifacts.

## Deviations from plan

- The cursor renders as decoded art at a fixed HUD anchor; pointer-locked
  cursor replacement arrives with the panel-bar interaction work
  (SB-16-02), which owns pointer behavior over the chrome.
- Font shadows decode (fixture + real data) but the foundation HUD draws
  unshadowed glyphs; the popup story applies shadow pairs where the
  original layouts use them.

## Follow-ups

- SB-16-02: the authentic panel bar from `panel_button` art driving build
  mode, stats, settings, and game speed.
