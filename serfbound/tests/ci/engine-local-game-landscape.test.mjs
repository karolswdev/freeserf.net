import assert from "node:assert/strict";
import { test } from "node:test";

import {
  landscapeForLocalGameSettings,
  mapObject,
  mapTerrain,
  restoreSerfboundLocalGame,
  startSerfboundLocalGame,
} from "@serfbound/engine";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

function startedGame() {
  const result = startSerfboundLocalGame({ data: dataSource });
  assert.equal(result.status, "started");
  return result;
}

test("local games expose a deterministic generated landscape", () => {
  const first = startedGame();
  const second = startedGame();

  const landscapeA = first.game.landscape();
  const landscapeB = second.game.landscape();

  assert.equal(landscapeA.tileCount, 4096);
  assert.deepEqual(Array.from(landscapeA.heights), Array.from(landscapeB.heights));
  assert.deepEqual(Array.from(landscapeA.objects), Array.from(landscapeB.objects));

  // Cached per game instance.
  assert.equal(first.game.landscape(), landscapeA);
});

test("restored games rebuild the identical landscape from the saved seed", () => {
  const started = startedGame();
  const restored = restoreSerfboundLocalGame(started.snapshot);
  assert.equal(restored.status, "started");

  const original = started.game.landscape();
  const rebuilt = restored.game.landscape();
  assert.deepEqual(Array.from(rebuilt.typesUp), Array.from(original.typesUp));
  assert.deepEqual(Array.from(rebuilt.minerals), Array.from(original.minerals));
});

test("generated landscapes obey reference placement rules", () => {
  const landscape = landscapeForLocalGameSettings({
    mapSize: 3,
    seedString: "3128716831287168",
  });

  let fishTiles = 0;
  let treeTiles = 0;
  let waterTreeTiles = 0;
  let mineralTiles = 0;

  for (let position = 0; position < landscape.tileCount; position += 1) {
    const object = landscape.objects[position];
    const typeUp = landscape.typesUp[position];
    const typeDown = landscape.typesDown[position];

    // Fish only live in water (mineral none + amount > 0 marks fish).
    if (landscape.minerals[position] === 0 && landscape.resourceAmounts[position] > 0) {
      fishTiles += 1;
      assert.equal(typeUp <= mapTerrain.water3, true, `fish at ${position} is on water`);
      assert.equal(typeDown <= mapTerrain.water3, true, `fish at ${position} is on water`);
    }

    if (landscape.minerals[position] !== 0) {
      mineralTiles += 1;
      assert.equal(
        landscape.resourceAmounts[position] >= 4 && landscape.resourceAmounts[position] <= 20,
        true,
        "mineral amounts follow the 4*(count-j) rule",
      );
    }

    // Trees/pines were placed with hexagon checks that include the tile's own
    // triangles, so they stand on grass.
    if (object >= mapObject.tree0 && object < mapObject.palm0) {
      treeTiles += 1;
      assert.equal(
        typeUp >= mapTerrain.grass0 && typeUp <= mapTerrain.grass2,
        true,
        `tree at ${position} stands on grass (typeUp ${typeUp})`,
      );
      assert.equal(
        typeDown >= mapTerrain.grass0 && typeDown <= mapTerrain.grass2,
        true,
        `tree at ${position} stands on grass (typeDown ${typeDown})`,
      );
    }

    if (object >= mapObject.waterTree0 && object < mapObject.waterTree0 + 4) {
      waterTreeTiles += 1;
      assert.equal(
        typeUp >= mapTerrain.water2 && typeUp <= mapTerrain.water3,
        true,
        `water tree at ${position} is in shallow water`,
      );
    }

    // Heights stay in the rescaled 0..31 range.
    assert.equal(landscape.heights[position] <= 31, true);
  }

  assert.equal(fishTiles > 0, true, "fish exist");
  assert.equal(treeTiles > 0, true, "trees exist");
  assert.equal(mineralTiles > 0, true, "minerals exist");
});
