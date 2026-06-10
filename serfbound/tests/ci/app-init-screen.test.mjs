import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  createFirstRenderLayerScene,
  initScreenRect,
  initScreenRowAt,
  nextSupplies,
  randomSeedString,
} from "@serfbound/app";
import { startSerfboundLocalGame, suppliesPresetResources } from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("init screen rows hit-test: seed, supplies, start", () => {
  const rect = initScreenRect({ width: 1280, height: 720 }, 2);
  assert.equal(initScreenRowAt(rect, 2, rect.x + 100, rect.y + 24 * 2 + 4), "seed");
  assert.equal(initScreenRowAt(rect, 2, rect.x + 100, rect.y + 56 * 2 + 4), "supplies");
  assert.equal(initScreenRowAt(rect, 2, rect.x + 100, rect.y + 100 * 2 + 4), "start");
  assert.equal(initScreenRowAt(rect, 2, rect.x + 100, rect.y + 4), null);
  assert.equal(initScreenRowAt(rect, 2, rect.x - 4, rect.y + 50), null);
});

test("supplies cycle and seed alphabet follow the reference options", () => {
  assert.equal(nextSupplies(5), 20);
  assert.equal(nextSupplies(20), 35);
  assert.equal(nextSupplies(35), 5);

  const seed = randomSeedString(() => 0.4239);
  assert.equal(seed.length, 16);
  assert.match(seed, /^[1-8]{16}$/);
});

test("the init screen draws over the import preview with decoded art", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const scene = createFirstRenderLayerScene({
    size: { width: 1280, height: 720 },
    decodedAssets: decoded,
    initScreen: { seedString: "1234567812345678", initialSupplies: 20, mapSize: 3 },
  });

  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");
  assert.equal(uiSprites.some((sprite) => sprite.key === "uilogo"), true, "logo drawn");
  assert.equal(uiSprites.some((sprite) => sprite.key === "uii:310"), true, "box background");
  // The seed digits render in the game font (digit glyphs 29..36 for 1..8).
  const digitGlyphs = uiSprites.filter((sprite) => {
    const match = sprite.key.match(/^uif:(\d+)$/);
    return match !== null && Number(match[1]) >= 30 && Number(match[1]) <= 37;
  });
  assert.equal(digitGlyphs.length >= 16, true, "seed digits drawn");
});

test("custom supplies flow into the castle inventory preset", () => {
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    initialSupplies: 35,
  });
  assert.equal(started.status, "started");
  assert.equal(started.game.settings.initialSupplies, 35);
  assert.equal(started.game.settings.seedString, "1234567812345678");

  const world = started.game.world();
  // Found a castle and check the stock against the supplies-35 preset.
  let founded = false;
  for (let position = 0; position < world.tileCount && !founded; position += 1) {
    founded = world.buildCastle(position, 0) !== null;
  }

  assert.equal(founded, true, "a castle site exists");
  const inventory = world.inventoryForPlayer(0);
  const expected = suppliesPresetResources(35);
  assert.equal(inventory.resources[7], expected[7], "planks follow the supplies-35 preset");
  assert.equal(inventory.resources[24], expected[24], "swords follow the supplies-35 preset");
});
