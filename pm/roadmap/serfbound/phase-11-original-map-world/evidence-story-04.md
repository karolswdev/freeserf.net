# Evidence — SB-11-04 — Scroll the Generated World in the Viewport

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/landscape-scene.ts` — new: landscape rendering
  over the generated world. Lattice vertex (c, r) maps to map position
  (scrollColumn + c + ceil(r/2), scrollRow + r); every map position is the
  apex of one up and one down triangle with terrain taken from typesUp[apex]
  and typesDown[upLeft(apex)] per the reference walk. Includes
  `buildLandscapeRenderAssets` (composes exactly the terrain combos the
  landscape contains + the object sprites it places),
  `createLandscapeScene` (wrapping window with height-lift margins),
  `mapTileToScreen`, and `screenToMapTile`.
- `serfbound/packages/app/src/render-layer-scene.ts` — decoded assets now
  carry raw decoded grounds, masks, and all generator-placed map object
  sprites (0..84 + flag) for landscape composition.
- `serfbound/packages/app/src/main.ts` — landscape assets build on game
  start/restore; arrow-key and pointer-drag scrolling in whole tile steps
  with wrapping; landscape-aware pointer-to-tile mapping; scroll/mode data
  attributes.
- `serfbound/scripts/capture-local-screenshots.mjs` — output dir/prefix
  parameterized (`SERFBOUND_CAPTURE_DIR`/`_PREFIX`), defaulting to an
  uncommitted scratch folder.
- `serfbound/tests/ci/app-landscape-scene.test.mjs` — viewport coverage,
  region resolution, scroll/wrap behavior, map/screen round-trips, flag
  tracking/culling.
- `serfbound/tests/browser/decoded-scene.spec.ts` — asserts landscape mode
  after start, arrow-key scrolling, and wrap to column 63.

## Verification artifacts

```text
node --test tests/ci/app-landscape-scene.test.mjs
# tests 5 / # pass 5 / # fail 0

npm run test:unit            -> # tests 75 / # pass 75 / # fail 0
npm run test:browser         -> 6 passed (5.1s)
```

Real-data capture (opt-in, local `SPAU.PA`):

```text
serfbound-local-screenshots-ok: 4654 decoded sprites on screen
artifacts/story-04-generated-world-running-game-desktop.png
```

Visual review: the running game now renders the classic generator's world
with real art — an organic mountain ridge with snow caps and tundra slopes,
rolling grass with height relief, clustered forests, lakes, and stones. This
replaces the Phase 10 synthetic wave field.

## Acceptance criteria — re-checked

- [x] The decoded scene renders the generated map (terrain, objects) instead
  of the synthetic field; built flags stay anchored to map positions
  (CI flag-tracking test).
- [x] Arrow keys and dragging scroll in whole tile steps; crossing the map
  edge wraps (CI wrap test + browser test asserting scroll 63,1).
- [x] Pointer hover/selection reports map positions while scrolled
  (`screenToMapTile`, round-trip CI test). Recorded simplification: picking
  ignores terrain height lift until the CoordinateSpace port.
- [x] Performance: scene rebuild on scroll is array iteration over the
  visible lattice only; browser suite timings unchanged.

## Deviations from plan

- The import-preview scene (before starting a game) keeps the Phase 10
  synthetic field; the generated world appears when a game starts, because
  the landscape derives from the game seed. Recorded as intended UX.
- Height-aware pointer picking deferred (noted in code and above).

## Follow-ups

- SB-11-05 adds waves and map borders on this path.
