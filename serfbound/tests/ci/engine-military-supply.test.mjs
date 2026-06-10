import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundCommandRouter,
  createInventory,
  inventoryPromoteSerfToKnight,
  mapTerrain,
  resourceType,
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

function foundedGame() {
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  world.heights.fill(4);
  world.typesUp.fill(mapTerrain.grass1);
  world.typesDown.fill(mapTerrain.grass1);
  world.objects.fill(0);
  world.minerals.fill(0);
  world.resourceAmounts.fill(0);
  const router = new SerfboundCommandRouter(started.game.state, world);
  const tileFor = (pos) => ({
    column: pos & world.geometry.columnMask,
    row: (pos >>> world.geometry.rowShift) & world.geometry.rowMask,
    position: pos,
  });
  const castlePosition = world.geometry.position(20, 20);
  const castleResult = router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: tileFor(castlePosition),
  });
  assert.equal(castleResult.status, "accepted");
  return { started, world, router, tileFor, castlePosition };
}

test("the weaponsmith forges a sword, then a shield for free, per resource pair", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  const site = world.geometry.positionAdd(castlePosition, 4, -2);
  const result = router.dispatch({
    type: "game.build-building",
    source: "pointer",
    tile: tileFor(site),
    buildingKind: "weaponSmith",
  });
  assert.equal(result.status, "accepted", "weaponsmith builds");
  const smith = [...world.buildings.values()].reduce((a, b) => (a.index > b.index ? a : b));
  const road = router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(castleFlagPosition),
    toTile: tileFor(world.flags.get(smith.flagIndex).position),
  });
  assert.equal(road.status, "accepted", "weaponsmith road connects");
  engine.dispatchConstructionLogistics(smith, 0);

  const inventory = world.inventoryForPlayer(0);
  // Isolate forging: keep the castle from recruiting the preset weapons
  // into knights while we count the smith's output.
  world.players[0].castleKnightsWanted = 0;
  const swordsBefore = inventory.resources[resourceType.sword];
  const shieldsBefore = inventory.resources[resourceType.shield];

  let fed = false;
  for (let tick = 0; tick < 600000; tick += 16) {
    engine.update(tick);
    if (smith.isDone && !fed) {
      // Exactly two resource pairs: must yield two swords and two shields.
      smith.deliveredResources[resourceType.coal] = 2;
      smith.deliveredResources[resourceType.steel] = 2;
      fed = true;
    }

    if (
      fed &&
      inventory.resources[resourceType.sword] >= swordsBefore + 2 &&
      inventory.resources[resourceType.shield] >= shieldsBefore + 2
    ) {
      break;
    }
  }

  assert.equal(smith.isDone, true, "the weaponsmith completed");
  assert.equal(
    inventory.resources[resourceType.sword] - swordsBefore,
    2,
    "two swords from two pairs",
  );
  assert.equal(
    inventory.resources[resourceType.shield] - shieldsBefore,
    2,
    "two free shields from two pairs",
  );
  assert.equal(smith.deliveredResources[resourceType.coal], 0, "coal consumed");
  assert.equal(smith.deliveredResources[resourceType.steel], 0, "steel consumed");
});

test("knight promotion consumes a generic serf, a sword, and a shield", () => {
  const inventory = createInventory(1, 0, 1, 1, 0);
  inventory.genericSerfs = 3;
  inventory.resources[resourceType.sword] = 2;
  inventory.resources[resourceType.shield] = 2;

  assert.equal(inventoryPromoteSerfToKnight(inventory), true);
  assert.equal(inventoryPromoteSerfToKnight(inventory), true);
  // Weapons exhausted: the third generic serf stays a serf.
  assert.equal(inventoryPromoteSerfToKnight(inventory), false);

  assert.equal(inventory.knights, 2);
  assert.equal(inventory.genericSerfs, 1);
  assert.equal(inventory.resources[resourceType.sword], 0);
  assert.equal(inventory.resources[resourceType.shield], 0);
});

test("the castle recruits its wanted knight stock as weapons arrive", () => {
  const { started, world } = foundedGame();
  const engine = started.game.serfEngine();
  const inventory = world.inventoryForPlayer(0);
  inventory.resources[resourceType.sword] = 5;
  inventory.resources[resourceType.shield] = 5;
  const genericsBefore = inventory.genericSerfs;

  engine.update(16);

  // Reference Player settings: CastleKnightsWanted defaults to 3.
  assert.equal(world.players[0].castleKnightsWanted, 3);
  assert.equal(inventory.knights, 3, "the castle recruited its wanted stock");
  assert.equal(inventory.genericSerfs, genericsBefore - 3);
  assert.equal(inventory.resources[resourceType.sword], 2);
  assert.equal(inventory.resources[resourceType.shield], 2);
});

test("knight morale follows the reference gold formula", () => {
  const { started, world } = foundedGame();
  const inventory = world.inventoryForPlayer(0);
  inventory.resources[resourceType.goldOre] = 0;
  inventory.resources[resourceType.goldBar] = 0;

  // No gold anywhere: UpdateKnightMorale sets 4096.
  world.updateKnightMorale(0);
  assert.equal(world.players[0].knightMorale, 4096);

  // Map gold 100, depot 50 (gold bars), single player:
  // morale = 1024 + (10 * 1024 * 1) * 50 / (100 + 50 in-economy gold).
  const depositSite = world.geometry.position(40, 40);
  world.minerals[depositSite] = 1; // gold
  world.resourceAmounts[depositSite] = 100;
  inventory.resources[resourceType.goldBar] = 50;
  world.updateKnightMorale(0);
  const expected = 1024 + Math.trunc((10 * 1024 * 1 * 50) / 150);
  assert.equal(world.players[0].knightMorale, expected);
  assert.equal(world.players[0].goldDeposited, 50);

  // Large totals shift down in pairs before the divide (reference loop):
  // total 196608 and depot 65536 both halve twice until total <= 0xffff.
  world.resourceAmounts[depositSite] = 0;
  world.minerals[depositSite] = 0;
  const bigDeposits = [
    world.geometry.position(10, 40),
    world.geometry.position(12, 40),
  ];
  for (const site of bigDeposits) {
    world.minerals[site] = 1;
  }

  // Map gold capped at 255 per tile, so spread the big total over bars.
  inventory.resources[resourceType.goldBar] = 65536;
  for (const site of bigDeposits) {
    world.resourceAmounts[site] = 0;
  }

  const extraInventoryGoldSite = world.geometry.position(14, 40);
  world.minerals[extraInventoryGoldSite] = 0;
  // total = 65536 (bars) + 131072 (ore held in stock) = 196608.
  inventory.resources[resourceType.goldOre] = 131072;
  world.updateKnightMorale(0);
  // shifts: total 196608 -> 49152, depot 65536 -> 16384;
  // morale = 1024 + 10240 * 16384 / 49152 = 1024 + 3413.
  assert.equal(world.players[0].knightMorale, 1024 + 3413);
});
