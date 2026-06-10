# Evidence — SB-16-03 — Build the Popup System

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/popup.ts` — the `PopupBox.cs` port as
  browser-native logic: the reference 144x160 box; the three build-menu
  pages with their exact building positions (`DrawBasicBuildingBox`,
  `DrawAdv1BuildingBox`, `DrawAdv2BuildingBox` — hut/stonecutter/
  lumberjack/forester/fisher/mill/boatbuilder/flag, butcher/weaponsmith/
  smelters/sawmill/baker, tower/fortress/toolmaker/stock/farm/pig farm);
  the flip button at (8,137) cycling pages; the `DrawResourcesBox` layout
  copied exactly (26 resources, icon/count positions per the reference
  table); the DiagonalGreen background pattern icon; and the sett popup's
  knight-occupation rows cycling the reference occupation values.
- `serfbound/packages/app/src/landscape-scene.ts` — popup rendering in
  the ui layer at 2x: the tiled 16x16 background pattern, frame_popup
  borders, build pages drawn with the real building sprites
  (`mapBuildingSprite`), the stats box with live inventory counts in the
  game font, and the sett box (occupation rows + morale).
- `serfbound/packages/app/src/main.ts` — popup state
  (`data-serfbound-popup`): the panel's build slot opens the build menu
  once the castle stands (castle placement stays direct), stats and sett
  slots open their popups; inside an open popup, build items dispatch
  `game.build-building`/`game.build-flag` at the selected tile (with
  construction logistics), the flip button cycles pages, sett rows cycle
  `knightOccupation` (feeding the engine's garrison sizes), and clicking
  outside closes.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — icons
  widened to 64 + the background pattern icon (310).
- `serfbound/tests/ci/app-popup.test.mjs` — six proofs: reference build
  positions, the exact resources layout, hit-testing (items, flip, empty
  space), the rendered build page (background tiling, building sprite
  positions, flag), the stats box (every icon + live font digits), and
  the sett rows.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e opens the
  stats popup from the panel, closes it by clicking outside, and opens
  the build menu.

## Verification artifacts

```text
node --test tests/ci/app-popup.test.mjs -> # tests 6 / pass 6
npm run test:unit -> # tests 139 / pass 139 / fail 0
npm run test:browser -> 6 passed (2.0m)
popup capture (real SPAU.PA) -> popup-captures-ok; saved
  artifacts/sb-16-03-popup-stats-desktop.png,
  artifacts/sb-16-03-popup-build-desktop.png,
  artifacts/sb-16-03-popup-sett-desktop.png
  (+ the standing sb-16-03 visual-gate captures)
```

Real-data review: the stats popup shows the original layout — the green
diagonal background pattern tiled across the box with the three reference
columns of decoded resource icons and live counts in the game font.

## Deviations from plan (recorded popup list)

- Shipped popups: build (3 pages), stats resources, sett knight
  occupation. Deferred with this record: serf stats, food/resource
  distribution sliders (`SlideBar`), transport priorities, building
  stats, ground analysis, save popup (the shell's save controls cover
  it), and the message/sett-select menu boxes — each lands when the
  feature it fronts becomes player-visible (Phase 18 missions/AI for
  most).
- Sett occupation adjusts by click-cycling the reference values instead
  of slider pairs; the engine consumes the same `knightOccupation`
  settings.
- Popups close by clicking outside (the original's exit buttons arrive
  with the deferred popup pages that carry them).

## Follow-ups

- SB-16-04: minimap + notifications (the map panel slot).
