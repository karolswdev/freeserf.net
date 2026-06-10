# Evidence — SB-16-04 — Minimap and Notifications

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/popup.ts` — the minimap model
  (`UI/Minimap.cs`, condensed): the 128x128 pixel field inside the popup
  box, terrain colors sampled from the reference minimap palette (water
  0x0000af, the grass green ramp, desert sands, tundra browns, snow
  whites), and `minimapTileAt` mapping canvas pixels to wrapped map tiles
  for navigation; the `map` popup kind.
- `serfbound/packages/app/src/render-layer-scene.ts` — decoded scenes now
  draw color primitives above the sprite pass (the minimap overlay path);
  the primitive renderer is shared between the generated-fixture and
  decoded paths.
- `serfbound/packages/app/src/landscape-scene.ts` — the map popup renders
  one colored block per map tile from live world terrain with owned land
  tinted toward the player, plus a translucent viewport marker at the
  scroll position; notifications render in the game font, top-center
  (`notice` scene option).
- `serfbound/packages/app/src/panel-bar.ts` — map/stats/sett slots show
  their active sprites now that all three popups exist.
- `serfbound/packages/app/src/main.ts` — the map slot opens the minimap;
  clicks inside it navigate (`currentScroll` jumps to the clicked tile);
  notifications surface game events (`data-serfbound-notification`):
  completed buildings ("BUILDING COMPLETE") and defeat ("GAME OVER"),
  persisting until replaced.
- `serfbound/tests/ci/app-minimap-notifications.test.mjs` — the minimap
  emits exactly two triangles per map tile plus the viewport marker, the
  reference palette colors differ by terrain, click-to-tile mapping works
  with wrapping and rejects clicks outside the field, and notifications
  render their glyphs in the game font.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e opens the
  minimap from the panel, navigates by clicking inside it (the scroll
  attribute changes), navigates back, closes it, and asserts the
  "BUILDING COMPLETE" notification after the lumberjack finishes.

## Verification artifacts

```text
node --test tests/ci/app-minimap-notifications.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 142 / pass 142 / fail 0
npm run test:browser -> 6 passed (1.9m)
minimap capture (real SPAU.PA) -> minimap-capture-ok; saved
  artifacts/sb-16-04-minimap-desktop.png
```

Real-data review: the minimap shows the generated world's lakes, desert
patches, and tundra in the reference palette inside the popup box over
the live map.

## Deviations from plan

- The minimap draws via color primitives (terrain palette per tile)
  rather than a 128x128 texture sprite; per-height shading and the
  reference minimap modes (ownership/roads/buildings toggles) are
  recorded for the Phase 19 polish pass.
- Notifications are a game-font banner plus a data attribute (the
  reference `NotificationBox` popup with icons lands with Phase 18's
  mission events, which produce the notification variety it exists for).
- The panel's message/return icons and timed-notification buttons remain
  deferred with the same Phase 18 record.

## Follow-ups

- SB-16-05: the authentic game start screen; the phase close retires the
  temporary HTML panel.
