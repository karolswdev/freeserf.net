import assert from "node:assert/strict";
import { test } from "node:test";

import { buildDecodedRenderAssets, createFirstRenderLayerScene } from "@serfbound/app";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

function createCatalogOnlyPaArchive() {
  // The same minimal archive the browser tests import: two defined entries,
  // no palette, no sprite payloads. Must stay non-decodable.
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, bytes.length, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, 4, true);
  view.setUint32(12, 24, true);
  view.setUint32(16, 4, true);
  view.setUint32(20, 28, true);
  return bytes;
}

test("decodable archives build decoded render assets with terrain and object regions", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());

  assert.notEqual(decoded, null);
  assert.equal(decoded.source, "dos-pa-decoded");
  assert.equal(decoded.terrainTriangleCount > 10, true);
  assert.equal(decoded.objectKeys.includes("obj:tree"), true);
  assert.equal(decoded.objectKeys.includes("obj:flag"), true);

  const regionKeys = Object.keys(decoded.atlas.regions);
  assert.equal(regionKeys.some((key) => key.startsWith("tu:")), true, "up triangles composed");
  assert.equal(regionKeys.some((key) => key.startsWith("td:")), true, "down triangles composed");
  assert.equal(decoded.atlas.regions["obj:flag"].height, 19, "flag region keeps sprite height");
  assert.equal(decoded.atlas.regions["obj:flag"].offsetY, -18, "flag region keeps header offset");
  assert.equal(decoded.atlas.rgba.length, decoded.atlas.width * decoded.atlas.height * 4);
});

test("catalog-only archives stay non-decodable and fall back gracefully", () => {
  assert.equal(buildDecodedRenderAssets(createCatalogOnlyPaArchive()), null);
});

test("the decoded scene renders sprite primitives from atlas regions", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const scene = createFirstRenderLayerScene({
    size: { width: 960, height: 540 },
    decodedAssets: decoded,
    builtStructures: [
      { id: 1, kind: "flag", tile: { column: 3, row: 2, position: 11 } },
    ],
  });

  assert.equal(scene.renderer, "webgl2");
  assert.equal(scene.assetSummary.source, "dos-pa-decoded");
  assert.equal(scene.atlas, decoded.atlas);
  assert.equal(scene.primitives.length, 0, "decoded scenes draw sprites, not colored triangles");

  const terrainSprites = scene.sprites.filter((sprite) => sprite.layer === "terrain");
  const expectedColumns = Math.ceil(960 / 32) + 2 + 2; // grid columns incl. margins
  const expectedRows = Math.ceil(540 / 20) + 4 + 3;
  assert.equal(
    terrainSprites.length > expectedColumns * expectedRows,
    true,
    `terrain covers the canvas with two triangles per cell (got ${terrainSprites.length})`,
  );

  for (const sprite of scene.sprites) {
    assert.notEqual(
      decoded.atlas.regions[sprite.key],
      undefined,
      `sprite key ${sprite.key} resolves to an atlas region`,
    );
  }

  const flagSprites = scene.sprites.filter((sprite) => sprite.key === "obj:flag");
  assert.equal(flagSprites.length, 1, "built flag renders the real flag sprite");
  assert.equal(flagSprites[0].layer, "markers");

  const layerCounts = Object.fromEntries(scene.layers.map((layer) => [layer.key, layer.primitiveCount]));
  assert.equal(layerCounts.terrain, terrainSprites.length);
  assert.equal(layerCounts.markers >= 1, true);
  assert.equal(scene.tilePrimitiveCount, terrainSprites.length);
  assert.equal(scene.assetSummary.mapGroundStatus.startsWith("decoded:"), true);
});

test("decoded scenes stay deterministic for identical input", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const sceneA = createFirstRenderLayerScene({ size: { width: 320, height: 200 }, decodedAssets: decoded });
  const sceneB = createFirstRenderLayerScene({ size: { width: 320, height: 200 }, decodedAssets: decoded });

  assert.deepEqual(sceneA.sprites, sceneB.sprites);
});
