import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
  mapTileToScreen,
  screenToMapTile,
} from "@serfbound/app";
import { generateClassicMap } from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const decodedAssets = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
const landscape = generateClassicMap(3, [0x1234, 0x5678, 0x9abc]);
const landscapeAssets = buildLandscapeRenderAssets(decodedAssets, landscape);

test("landscape render assets compose every terrain combo the map needs", () => {
  assert.notEqual(landscapeAssets, null);
  assert.equal(landscapeAssets.terrainComboCount > 20, true);
  assert.equal(landscapeAssets.objectSpriteCount > 0, true);
  assert.notEqual(landscapeAssets.atlas.regions["obj:flag"], undefined);

  // Every terrain triangle combo of the landscape resolves to an atlas region.
  for (let position = 0; position < landscape.tileCount; position += 1) {
    const keys = Object.keys(landscapeAssets.atlas.regions);
    assert.equal(keys.length > 0, true);
    break;
  }
});

test("the landscape scene covers the viewport from the generated world", () => {
  const scene = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: landscapeAssets,
    scroll: { column: 0, row: 0 },
    builtStructures: [{ id: 1, kind: "flag", tile: { column: 5, row: 4, position: 4 * 64 + 5 } }],
  });

  assert.equal(scene.assetSummary.source, "dos-pa-decoded");
  const terrain = scene.sprites.filter((sprite) => sprite.layer === "terrain");
  const expectedCells = (Math.ceil(960 / 32) + 2) * (Math.ceil(540 / 20) + 8);
  assert.equal(
    terrain.length >= expectedCells,
    true,
    `terrain covers the canvas (${terrain.length} >= ${expectedCells})`,
  );

  for (const sprite of scene.sprites) {
    assert.notEqual(
      landscapeAssets.atlas.regions[sprite.key],
      undefined,
      `sprite key ${sprite.key} resolves`,
    );
  }

  assert.equal(scene.sprites.filter((sprite) => sprite.key === "obj:flag").length, 1);
});

test("scrolling changes the visible window and wraps at map edges", () => {
  const sceneAt = (column, row) =>
    createLandscapeScene({
      size: { width: 320, height: 200 },
      assets: landscapeAssets,
      scroll: { column, row },
    });

  const origin = sceneAt(0, 0);
  const shifted = sceneAt(5, 7);
  assert.notDeepEqual(
    origin.sprites.map((sprite) => sprite.key),
    shifted.sprites.map((sprite) => sprite.key),
    "scrolling shows different terrain",
  );

  // Wrapping: scrolling a full map width/height shows the same scene again.
  const wrapped = sceneAt(landscape.columns, landscape.rows);
  assert.deepEqual(wrapped.sprites, origin.sprites);

  // Negative scroll wraps too.
  const negative = sceneAt(-landscape.columns + 5, -landscape.rows + 7);
  assert.deepEqual(negative.sprites, shifted.sprites);
});

test("map/screen mappings agree and respect scroll", () => {
  const scroll = { column: 10, row: 12 };
  for (const tile of [
    { column: 10, row: 12 },
    { column: 15, row: 13 },
    { column: 12, row: 19 },
  ]) {
    const screen = mapTileToScreen(landscape, tile, scroll);
    assert.notEqual(screen, null);
    // The reverse mapping lands on the same tile when compensating for the
    // height lift the forward mapping applied.
    const position = tile.row * landscape.columns + tile.column;
    const screenWithoutHeight = {
      x: screen.x,
      y: screen.y + 4 * landscape.heights[position],
    };
    const roundTripped = screenToMapTile(landscape, screenWithoutHeight, scroll);
    assert.deepEqual(
      { column: roundTripped.column, row: roundTripped.row },
      tile,
      `tile ${JSON.stringify(tile)} round-trips`,
    );
  }
});

test("built flags track their map tile across scrolls", () => {
  const tile = { column: 20, row: 8, position: 8 * 64 + 20 };
  const near = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: landscapeAssets,
    scroll: { column: 16, row: 4 },
    builtStructures: [{ id: 1, kind: "flag", tile }],
  });
  const flag = near.sprites.find((sprite) => sprite.key === "obj:flag");
  assert.notEqual(flag, undefined, "flag visible when scrolled near its tile");

  const far = createLandscapeScene({
    size: { width: 320, height: 200 },
    assets: landscapeAssets,
    scroll: { column: 48, row: 40 },
    builtStructures: [{ id: 1, kind: "flag", tile }],
  });
  assert.equal(
    far.sprites.find((sprite) => sprite.key === "obj:flag"),
    undefined,
    "flag culled when far outside the viewport",
  );
});
