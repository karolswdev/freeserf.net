import assert from "node:assert/strict";
import { test } from "node:test";

import { buildTypedAssetCatalog, parseDosPaCatalog } from "@serfbound/assets";
import {
  createFirstRenderLayerScene,
  renderLayerOrder,
  resolveFirstRenderLayerPointer,
} from "@serfbound/app";

function createGeneratedPaArchive(entryCount, entryFacts) {
  const tableStart = 8;
  const tableEnd = tableStart + entryCount * 8;
  const payloadEnd = Math.max(
    tableEnd,
    ...entryFacts.map((entry) => entry.offset + entry.size),
  );
  const bytes = new Uint8Array(payloadEnd);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, payloadEnd, true);
  view.setUint32(4, entryCount, true);

  for (const entry of entryFacts) {
    const tableOffset = tableStart + (entry.index - 1) * 8;
    view.setUint32(tableOffset, entry.size, true);
    view.setUint32(tableOffset + 4, entry.offset, true);
  }

  return bytes;
}

test("first render-layer scene is generated, layered, sorted, and engine-backed", () => {
  const scene = createFirstRenderLayerScene();

  assert.equal(scene.renderer, "webgl2");
  assert.equal(scene.mapSize, 3);
  assert.deepEqual(
    scene.layers.map((layer) => layer.key),
    Array.from(renderLayerOrder),
  );
  assert.equal(scene.assetSummary.source, "generated-fixture");
  assert.equal(scene.assetSummary.mapGroundStatus, "generated-fixture");
  // The ui layer fills only on decoded scenes (SB-16-01 chrome).
  assert.equal(
    scene.layers.every((layer) => layer.primitiveCount > 0 || layer.key === "ui"),
    true,
  );
  assert.equal(scene.tilePrimitiveCount > 100, true);

  for (let index = 1; index < scene.primitives.length; index += 1) {
    const previous = scene.primitives[index - 1];
    const current = scene.primitives[index];
    const previousLayer = renderLayerOrder.indexOf(previous.layer);
    const currentLayer = renderLayerOrder.indexOf(current.layer);
    assert.equal(previousLayer <= currentLayer, true, `primitive ${index} layer order`);
  }

  assert.equal(
    scene.primitives.some((primitive) => primitive.assetRole === "renderer.mapGround"),
    true,
  );
  assert.equal(
    scene.primitives.some((primitive) => primitive.assetRole === "renderer.mapObjects"),
    true,
  );
});

test("first render-layer scene records typed DOS catalog renderer asset status", () => {
  const archive = createGeneratedPaArchive(4000, [
    { index: 260, offset: 32008, size: 16 },
    { index: 261, offset: 32024, size: 16 },
    { index: 300, offset: 32040, size: 16 },
    { index: 1250, offset: 32056, size: 16 },
    { index: 1500, offset: 32072, size: 16 },
  ]);
  const typedCatalog = buildTypedAssetCatalog(parseDosPaCatalog(archive));
  const scene = createFirstRenderLayerScene({ typedAssetCatalog: typedCatalog });

  assert.equal(scene.assetSummary.source, "dos-pa-catalog");
  assert.equal(scene.assetSummary.definedArchiveEntries, 5);
  assert.equal(scene.assetSummary.mapGroundStatus, "partial:2/33");
  assert.equal(scene.assetSummary.pathGroundStatus, "partial:1/10");
  assert.equal(scene.assetSummary.mapObjectsStatus, "partial:1/194");
  assert.equal(scene.assetSummary.mapShadowsStatus, "partial:1/194");
});

test("first render-layer scene renders built flag structures above terrain", () => {
  const scene = createFirstRenderLayerScene({
    builtStructures: [
      {
        id: 1,
        kind: "flag",
        placedAtTick: 0,
        tile: { column: 26, row: 16, position: 1050 },
      },
    ],
  });
  const flagPrimitives = scene.primitives.filter(
    (primitive) => primitive.assetRole === "game.builtFlag",
  );

  assert.equal(flagPrimitives.length, 3);
  assert.equal(flagPrimitives.filter((primitive) => primitive.layer === "objects").length, 2);
  assert.equal(flagPrimitives.filter((primitive) => primitive.layer === "markers").length, 1);
  assert.equal(
    scene.layers.find((layer) => layer.key === "markers").primitiveCount > 0,
    true,
  );
});

test("first render-layer pointer mapping resolves screen points through scene projection", () => {
  assert.deepEqual(
    resolveFirstRenderLayerPointer({ x: 480, y: 270 }, { width: 960, height: 540 }),
    {
      screen: { x: 480, y: 270 },
      view: { x: 480, y: 270 },
      map: { x: 576, y: 310 },
      tile: { column: 26, row: 16, position: 1050 },
    },
  );
  assert.deepEqual(
    resolveFirstRenderLayerPointer({ x: 240, y: 180 }, { width: 960, height: 540 }),
    {
      screen: { x: 240, y: 180 },
      view: { x: 240, y: 180 },
      map: { x: 336, y: 220 },
      tile: { column: 17, row: 13, position: 849 },
    },
  );
  assert.deepEqual(
    resolveFirstRenderLayerPointer({ x: -100, y: -100 }, { width: 960, height: 540 }),
    {
      screen: { x: -100, y: -100 },
      view: { x: 0, y: 0 },
      map: { x: 96, y: 40 },
      tile: { column: 5, row: 4, position: 261 },
    },
  );
});
