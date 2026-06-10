import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
} from "@serfbound/app";
import {
  SerfboundGameWorld,
  generateClassicMap,
  mapTerrain,
} from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const decodedAssets = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
const landscape = generateClassicMap(3, [0x1234, 0x5678, 0x9abc]);
const landscapeAssets = buildLandscapeRenderAssets(decodedAssets, landscape);

function flatWorld() {
  const world = new SerfboundGameWorld({
    ...landscape,
    heights: new Uint8Array(landscape.tileCount).fill(4),
    typesUp: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    typesDown: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    objects: new Uint8Array(landscape.tileCount),
    minerals: new Uint8Array(landscape.tileCount),
    resourceAmounts: new Uint8Array(landscape.tileCount),
  });
  for (let position = 0; position < world.owners.length; position += 1) {
    world.owners[position] = 0;
  }

  return world;
}

test("all path ground/mask combos compose into the atlas", () => {
  assert.equal(landscapeAssets.pathComboCount, 270, "10 grounds x 27 masks");
  assert.notEqual(landscapeAssets.atlas.regions["path:1:4"], undefined);
  assert.notEqual(landscapeAssets.atlas.regions["path:9:22"], undefined);
});

test("built roads and world flags render in the landscape scene", () => {
  const world = flatWorld();
  const a = world.geometry.position(6, 6);
  const b = world.geometry.position(10, 6);
  world.buildFlag(a, 0);
  world.buildFlag(b, 0);
  assert.equal(
    world.buildRoad({ start: a, directions: ["Right", "Right", "Right", "Right"] }, 0),
    true,
  );

  const scene = createLandscapeScene({
    size: { width: 960, height: 540 },
    assets: landscapeAssets,
    scroll: { column: 0, row: 0 },
    world,
  });

  const roadSprites = scene.sprites.filter((sprite) => sprite.key.startsWith("path:"));
  assert.equal(roadSprites.length >= 4, true, `road segments render (${roadSprites.length})`);
  // Flat grass roads use ground sprite 1 (slope class 1) and mask 4 (flat Right).
  assert.equal(
    roadSprites.some((sprite) => sprite.key === "path:1:4"),
    true,
    "flat right-direction segments use the reference mask/ground pair",
  );

  const flagSprites = scene.sprites.filter((sprite) => sprite.key === "obj:flag");
  assert.equal(flagSprites.length, 2, "both world flags render the real flag sprite");

  for (const sprite of scene.sprites) {
    assert.notEqual(
      landscapeAssets.atlas.regions[sprite.key],
      undefined,
      `sprite key ${sprite.key} resolves`,
    );
  }
});
