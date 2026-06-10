# Evidence — SB-21-01 — Authentic Frame Chrome

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/popup.ts` — the Box.cs type-1 border
  geometry as data: `popupBorderSize` (8/8/9/7), `popupBorderLayout()`
  (top sprite 0, left 2, right 3, bottom 1, sides between the
  horizontals), and `popupInterior` (the 128x144 content area). The sett
  audio row moves 146→144 so its text stays inside the interior (the
  bottom border starts at 153).
- `serfbound/packages/app/src/landscape-scene.ts` — the popup draws all
  four border pieces at the reference positions (it previously drew only
  sprite 0 plus the bottom bar misplaced at the top-right corner) and
  tiles the DiagonalGreen pattern over the inset interior instead of the
  whole box; the audio row renders from `settAudioRowY`.
- `serfbound/packages/app/src/render-layer-scene.ts` — the init screen
  gets the same four-piece assembly; the 144-tall side sprites crop to
  the condensed 128-tall box's 112px interior in the pre-game atlas; the
  interior pattern insets; the title clears the top border.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — the
  fixture's frame_popup entries now use the reference piece sizes
  (144x9 top, 144x7 bottom, 8x144 sides) instead of four uniform 16x144
  blocks, so CI exercises the real geometry.
- Tests: `app-popup.test.mjs` (border layout vs Box.cs, four pieces
  placed in the scene, 8x9 inset interior tiles), `app-init-screen.test.mjs`
  (four pieces around the condensed box, cropped side height, 8x7 inset
  tiles), `app-ui-art.test.mjs` (reference piece sizes in the atlas),
  `app-panel-bar.test.mjs` (PanelBar.BackgroundLayout audited triplet for
  triplet — the port was already exact), `decoded-scene.spec.ts` (audio
  row position), `mobile-play.spec.ts` (castle probe grid widened to the
  whole visible map — see deviations).

## Verification artifacts

```text
npm run test:unit -> # tests 173 / pass 173 / fail 0
npm run test:browser -> 9 passed (2.1m)
npm run test:local:assets -> serfbound-local-asset-tests-ok (real SPAU.PA)
npm run capture:local:screenshots ->
  serfbound-local-screenshots-ok: 5289 decoded sprites on screen; saved
  artifacts/capture-import-preview-desktop.png,
  artifacts/capture-import-preview-canvas.png,
  artifacts/capture-running-game-desktop.png
```

Real-data captures under `artifacts/` show the init box surrounded by
the complete wooden frame on all four sides with the interior pattern
inset (previously: top-left bar only, bottom bar floating top-right,
pattern under the border art).

## Deviations from plan

- The reference popup is 144x160 and its 8x144 side pieces fit exactly;
  the condensed init box (144x128) crops the side sprites to its 112px
  interior height. Recorded as the intended treatment for the condensed
  pre-game box.
- The fixture archive's frame-piece resize changed the generated
  archive's byte length, which feeds `deriveLocalGameSeedString` — every
  generated-data e2e world re-rolled. The mobile spec's castle probe
  grid covered only the top half of the phone canvas and missed valid
  sites on the new world; it now probes a 7x8 grid across the whole
  visible map (the desktop spec's equivalent strategy). The phase-10
  generated-archive screenshot regenerated for the same reason and ships
  in this commit.
- Popup-by-popup real-data captures land with the SB-21-05 visual gate;
  this story's captures prove the chrome on the init screen and the
  running game.

## Follow-ups

- SB-21-02: font shadows and text colors (the captures still show the
  unreadable light-green HUD text this phase exists to fix).
