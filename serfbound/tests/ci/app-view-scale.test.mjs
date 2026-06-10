import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
  screenToMapTile,
  uiScaleFor,
} from "@serfbound/app";
import { startSerfboundLocalGame } from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-21-03: device-pixel-ratio-aware UI scaling and integer world view
// scales (the modern SVGA).

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("uiScaleFor decides in CSS pixels and multiplies by the pixel ratio", () => {
  // Desktop at DPR 1: today's behavior.
  assert.equal(uiScaleFor({ width: 1280, height: 720 }), 2);
  assert.equal(uiScaleFor({ width: 390, height: 664 }), 1);
  // Desktop at DPR 2: same apparent size, sharp (2x base * 2).
  assert.equal(uiScaleFor({ width: 2560, height: 1440 }, 2), 4);
  // Phone at DPR 3: 390 CSS pixels stays the narrow 1x base * 3.
  assert.equal(uiScaleFor({ width: 1170, height: 1992 }, 3), 3);
  // Fractional ratios round to the nearest integer art scale.
  assert.equal(uiScaleFor({ width: 1920, height: 1080 }, 1.5), 4);
});

test("the world view scale zooms map layers and leaves UI chrome alone", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());
  const base = createLandscapeScene({
    size: { width: 1280, height: 720 },
    assets,
    scroll: { column: 0, row: 0 },
    world,
  });
  const zoomed = createLandscapeScene({
    size: { width: 1280, height: 720 },
    assets,
    scroll: { column: 0, row: 0 },
    world,
    view: { scale: 2 },
  });

  // The same first terrain sprite doubles its position and scale.
  const baseTerrain = base.sprites.find((sprite) => sprite.layer === "terrain");
  const zoomedTerrain = zoomed.sprites.find(
    (sprite) => sprite.layer === "terrain" && sprite.key === baseTerrain.key,
  );
  assert.notEqual(zoomedTerrain, undefined, "matching terrain sprite at 2x");
  assert.equal(zoomedTerrain.x, baseTerrain.x * 2);
  assert.equal(zoomedTerrain.y, baseTerrain.y * 2);
  assert.equal(zoomedTerrain.scale, 2);

  // Fewer map tiles fit at 2x; the UI cursor still draws at the ui scale.
  assert.equal(zoomed.tilePrimitiveCount < base.tilePrimitiveCount, true);
  const cursor = zoomed.sprites.find((sprite) => sprite.key === "uic");
  assert.notEqual(cursor, undefined, "cursor on screen at 2x");
  assert.equal(cursor.scale, 2, "ui chrome keeps uiScaleFor, not the view scale");
});

test("screen-to-tile picking divides by the view scale", () => {
  const started = startSerfboundLocalGame({ data: dataSource });
  const landscape = started.game.landscape();
  const scroll = { column: 0, row: 0 };
  const at1x = screenToMapTile(landscape, { x: 96, y: 60 }, scroll);
  const at2x = screenToMapTile(landscape, { x: 192, y: 120 }, scroll, 2);
  assert.deepEqual(at2x, at1x, "the same map pixel picks the same tile");
});
