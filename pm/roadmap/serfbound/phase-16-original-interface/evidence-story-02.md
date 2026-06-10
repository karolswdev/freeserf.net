# Evidence — SB-16-02 — Build the Authentic Panel Bar

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/panel-bar.ts` — the `PanelBar.cs` port as
  browser-native logic: the reference 320x40 layout with five 32x32
  `panel_button` slots at `(64 + i * 48, 4)`, the exact 20-piece
  `BackgroundLayout` of `frame_bottom` sprites, bottom-center docking,
  pixel hit-testing (`panelButtonAt`, `pointInPanelBar`), and
  `panelButtonSprites` (the reference `ButtonTypeFromBuildPossibility`:
  castle/large/small/mine/flag/inactive build sprite, `BuildRoad` vs
  `BuildRoadStarred` for road mode, map/stats/sett inactive until their
  popups land).
- `serfbound/packages/app/src/render-layer-scene.ts` — `frame_bottom`
  decodes into the render assets (`rawBottomFrames`).
- `serfbound/packages/app/src/landscape-scene.ts` — the scene draws the
  panel bar in the ui layer at 2x: background pieces per the reference
  layout, then the five button sprites; `uifb:` atlas keys.
- `serfbound/packages/app/src/main.ts` — panel state computed from the
  game (`computeBuildPossibility` over the selected tile, road mode), the
  bar's button sprites exposed via `data-serfbound-panel-buttons`, and
  canvas pointer-down hit-tests the bar before any map interaction:
  slot 0 builds what its sprite shows (castle/flag now; the build popup
  takes over in SB-16-03), slot 1 toggles road mode with the same
  semantics as the shell road button, slots 2–4 record
  `panel-popup-pending` until SB-16-03/04.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — 26
  panel buttons and 26 frame_bottom pieces in the CI fixture archive.
- `serfbound/tests/ci/app-panel-bar.test.mjs` — layout/hit-test fixtures
  (dock rect, slot positions, gaps and edges), button-sprite selection
  per possibility and road mode, and the rendered scene's piece-for-piece
  background and slot positions at 2x.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the founding e2e
  asserts the live panel buttons attribute and drives road mode on and
  off by clicking the road slot on the canvas.

## Verification artifacts

```text
node --test tests/ci/app-panel-bar.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 133 / pass 133 / fail 0
npm run test:browser -> 6 passed (1.6m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5237 decoded sprites; saved
     artifacts/sb-16-02-import-preview-desktop.png,
     artifacts/sb-16-02-import-preview-canvas.png,
     artifacts/sb-16-02-running-game-desktop.png
```

Real-data review: the running-game capture shows the original wooden
panel-bar art (frame_bottom background with the round panel_button
medallions) docked bottom-center over the live map — decoded from the
player's own `SPAU.PA`.

## Temporary-panel migration (recorded)

The HTML side panel's build-flag/build-road duties are now driven by the
authentic bar (the e2e proves the road toggle); the side panel's buttons
remain as test scaffolding until the build popup (SB-16-03) covers
building selection, after which SB-16-05 retires the temporary controls
per the phase constraint. Save/load/import stay browser-native shell
functions outside the original UI.

## Deviations from plan

- Message/return icons, game-speed buttons, and the blinking message
  state arrive with notifications (SB-16-04), which owns those flows.
- Button "flashing" (blink timer) is deferred to SB-16-04's notification
  work where the reference uses it.

## Follow-ups

- SB-16-03: the popup system (build menus first) replacing the slot-0
  direct action.
