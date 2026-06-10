import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
  minimapTerrainColors,
  minimapTileAt,
  popupRect,
} from "@serfbound/app";
import { mapTerrain, startSerfboundLocalGame } from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

function decodedWorldScene(extra) {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());
  const scene = createLandscapeScene({
    size: { width: 1280, height: 720 },
    assets,
    scroll: { column: 5, row: 7 },
    world,
    ...extra,
  });
  return { scene, world };
}

test("the minimap renders one colored block per map tile plus the viewport", () => {
  const { scene, world } = decodedWorldScene({ popup: { kind: "map" } });
  // Two triangles per tile plus the viewport marker's two.
  assert.equal(scene.primitives.length, world.columns * world.rows * 2 + 2);
  assert.equal(
    scene.primitives.every((primitive) => primitive.assetRole === "ui.minimap"),
    true,
  );

  // Terrain colors come from the reference minimap palette: a water tile
  // and a grass tile differ.
  const waterColor = minimapTerrainColors[mapTerrain.water0];
  const grassColor = minimapTerrainColors[mapTerrain.grass1];
  assert.deepEqual(waterColor, [0x00, 0x00, 0xaf]);
  assert.deepEqual(grassColor, [0x6b, 0xab, 0x3b]);
  assert.notDeepEqual(waterColor, grassColor);
});

test("minimap clicks map to wrapped map tiles for navigation", () => {
  const rect = popupRect({ width: 1280, height: 720 }, 2);
  // The field's top-left pixel is tile (0, 0).
  const topLeft = minimapTileAt(rect, 2, rect.x + 8 * 2, rect.y + 16 * 2, 64, 64);
  assert.deepEqual(topLeft, { column: 0, row: 0 });
  // The center lands mid-map.
  const center = minimapTileAt(
    rect, 2,
    rect.x + 8 * 2 + 128, rect.y + 16 * 2 + 128,
    64, 64,
  );
  assert.deepEqual(center, { column: 32, row: 32 });
  // Outside the pixel field is no navigation.
  assert.equal(minimapTileAt(rect, 2, rect.x + 2, rect.y + 2, 64, 64), null);
});

test("notifications render in the game font above the map", () => {
  const { scene } = decodedWorldScene({ notice: "BUILDING COMPLETE" });
  const glyphs = scene.sprites.filter(
    (sprite) => sprite.layer === "ui" && sprite.key.startsWith("uif:"),
  );
  // "BUILDING COMPLETE" has 16 letters beyond the HUD's own text.
  assert.equal(glyphs.length >= 16, true, "notice glyphs drawn");
  // The first letter is 'B' (glyph 1).
  assert.equal(glyphs.some((sprite) => sprite.key === "uif:1"), true);
});
