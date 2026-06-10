# Evidence — SB-21-03 — High-Resolution Rendering and View Scales

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/main.ts` — the canvas backing store sizes
  to CSS pixels × devicePixelRatio (clamped 1–4); pointer events convert
  CSS → canvas pixels (with the preview branch keeping canvas-pixel
  screen points for UI hit tests — a real bug the high-DPI e2e caught);
  drag steps account for pixel ratio and world scale; the world view
  scale cycles 1x/2x/3x via the V key and the shell's "View scale"
  button, defaulting to the screen's integer pixel ratio (the modern
  SVGA: same apparent layout, native sharpness);
  `data-serfbound-pixel-ratio`/`data-serfbound-view-scale` expose state.
- `serfbound/packages/app/src/panel-bar.ts` — `uiScaleFor` decides in
  CSS pixels and multiplies by the integer pixel ratio, so chrome keeps
  its apparent size on high-DPI backing stores.
- `serfbound/packages/app/src/landscape-scene.ts` — `view.scale` zooms
  map layers at the push seam (positions × scale, sprite scale) with the
  visible lattice shrunk to match; `screenToMapTile` divides by the view
  scale; UI chrome scales independently.
- `serfbound/packages/app/src/render-layer-scene.ts` — the decoded
  preview map scales by the pixel ratio the same way.
- `serfbound/packages/app/src/styles.css` — canvas `flex-basis: 0`: the
  backing-store height attribute must not feed back into layout (the
  DPR-sized store otherwise doubled the canvas height every render — the
  runaway the debug probe caught).
- `serfbound/scripts/capture-local-screenshots.mjs` — opt-in
  `SERFBOUND_CAPTURE_DPR` captures at a device scale factor for
  sharpness evidence.
- `serfbound/docs/player-guide.md` — documents native-resolution
  rendering and the view-scale control; `npm run test:docs` passes.
- Tests: `tests/ci/app-view-scale.test.mjs` (uiScaleFor ratio matrix,
  2x scene doubles map positions/scale while the cursor keeps the UI
  scale, screen-to-tile picking divides by view scale);
  `tests/browser/high-dpi.spec.ts` (DPR-2 context: backing store =
  CSS × 2, init-screen click starts the game, castle founded by pointer,
  view scale cycles 2→3→1 from the shell control).

## Verification artifacts

```text
npm run test:ci -> # tests 177 / pass 177 / fail 0; 10 passed (1.8m)
npm run test:docs -> serfbound-docs-ok
npm run measure:scale -> scale-baseline-ok: size6 2035473 ticks/s;
  scene builds size3=2.81ms, size5=2.27ms (guard bands hold)
npm run capture:local:screenshots (SERFBOUND_CAPTURE_DPR=2) ->
  serfbound-local-screenshots-ok: 5769 decoded sprites on screen; saved
  artifacts/capture-dpr2-{import-preview-desktop,import-preview-canvas,
  running-game-desktop}.png
```

The `capture-dpr2-*` captures show the running game at DPR 2: same
apparent layout as the DPR-1 captures beside them, with double the
world detail and pixel-sharp chrome/text (previously the browser
upscaled a CSS-pixel store, blurry on every high-DPI screen). The
mobile e2e (iPhone 13 profile, deviceScaleFactor 3) passes through the
same pipeline.

## Deviations from plan

- The original's fixed VGA/SVGA mode list is replaced by
  native-resolution rendering plus integer view scales (recorded in the
  story as the intended modernization).
- Fractional device pixel ratios (1.5, 2.625) round to the nearest
  integer art scale: art stays crisp; apparent size deviates slightly
  from CSS-exact on those screens.
- The default view scale follows the device pixel ratio rather than
  always 1: on high-DPI screens this preserves the apparent world size
  players already know while gaining sharpness; choosing 1x explicitly
  shows more map.
- The shell screenshots from earlier phases regenerated because the
  shell gained the "View scale" button (story-caused; committed).

## Follow-ups

- SB-21-04: pinch-zoom maps onto these view scales.
