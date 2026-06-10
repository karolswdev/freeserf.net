import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundCommandRouter,
  SerfboundSerfEngine,
  inventoryTakeResource,
  inventoryTakeSerf,
  resourceType,
  startSerfboundLocalGame,
  suppliesPresetResources,
} from "@serfbound/engine";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("the supplies preset interpolates the reference templates exactly", () => {
  // Exact template rows at the boundaries.
  assert.deepEqual(
    Array.from(suppliesPresetResources(0)),
    [0, 0, 0, 0, 0, 0, 0, 7, 0, 2, 0, 0, 0, 0, 0, 1, 6, 1, 0, 0, 1, 2, 3, 0, 10, 10],
  );
  assert.deepEqual(
    Array.from(suppliesPresetResources(10)),
    [2, 1, 1, 3, 2, 1, 0, 25, 1, 8, 4, 3, 8, 2, 1, 3, 12, 2, 1, 1, 2, 3, 4, 1, 30, 30],
  );
  assert.deepEqual(
    Array.from(suppliesPresetResources(40)),
    [30, 10, 30, 50, 10, 30, 10, 200, 10, 100, 30, 150, 100, 10, 5, 20, 50, 10, 5, 10, 20, 20, 50, 10, 200, 200],
  );

  // Mid-range interpolation per the reference fixed-point math: at supplies
  // 25, planks: n = (80-40)*5*6554 >= 0x8000 rounds t1 to 41, plus n>>16 = 20.
  const mid = suppliesPresetResources(25);
  assert.equal(mid[resourceType.plank], 61);
  // Stones: n = (40-20)*5*6554 rounds t1 to 21, plus 10.
  assert.equal(mid[resourceType.stone], 31);
});

test("the castle inventory stocks resources and serfs that deplete", () => {
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const router = new SerfboundCommandRouter(started.game.state, world);
  let castlePosition = -1;
  for (let p = 0; p < world.tileCount; p += 1) {
    if (world.canBuildCastle(p, 0)) {
      castlePosition = p;
      break;
    }
  }
  router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: {
      column: castlePosition & world.geometry.columnMask,
      row: (castlePosition >>> world.geometry.rowShift) & world.geometry.rowMask,
      position: castlePosition,
    },
  });

  const inventory = world.inventoryForPlayer(0);
  assert.notEqual(inventory, null);
  // Supplies preset 20 = template row 2 exactly.
  assert.equal(inventory.resources[resourceType.plank], 40);
  assert.equal(inventory.resources[resourceType.stone], 20);
  assert.equal(inventory.genericSerfs, 25);

  // Taking depletes; an empty stock refuses.
  assert.equal(inventoryTakeResource(inventory, resourceType.plank), true);
  assert.equal(inventory.resources[resourceType.plank], 39);
  inventory.resources[resourceType.boat] = 0;
  assert.equal(inventoryTakeResource(inventory, resourceType.boat), false);

  // Spawning serfs consumes the stocked crew.
  const engine = new SerfboundSerfEngine(world);
  const before = inventory.genericSerfs;
  assert.notEqual(engine.spawnGenericSerf(0, 0), null);
  assert.equal(inventory.genericSerfs, before - 1);
  inventory.genericSerfs = 0;
  assert.equal(engine.spawnGenericSerf(0, 0), null, "an empty castle spawns nobody");
  assert.equal(inventoryTakeSerf(inventory), false);
});

test("construction logistics draw materials from the castle stock", () => {
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const engine = started.game.serfEngine();
  const router = new SerfboundCommandRouter(started.game.state, world);
  const tileFor = (pos) => ({
    column: pos & world.geometry.columnMask,
    row: (pos >>> world.geometry.rowShift) & world.geometry.rowMask,
    position: pos,
  });
  let castlePosition = -1;
  for (let p = 0; p < world.tileCount; p += 1) {
    if (world.canBuildCastle(p, 0)) {
      castlePosition = p;
      break;
    }
  }
  router.dispatch({ type: "game.build-castle", source: "pointer", tile: tileFor(castlePosition) });
  const castleFlag = world.flagAt(world.move(castlePosition, "DownRight"));

  let building = null;
  for (let offset = 0; offset < 250 && building === null; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (!world.canBuildBuilding(candidate, 2, 0)) {
      continue;
    }

    const result = router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(candidate),
      buildingKind: "lumberjack",
    });
    if (result.status !== "accepted") {
      continue;
    }

    building = [...world.buildings.values()].reduce((a, b) => (a.index > b.index ? a : b));
    const road = router.dispatch({
      type: "game.build-road",
      source: "pointer",
      tile: tileFor(castleFlag.position),
      toTile: tileFor(world.flags.get(building.flagIndex).position),
    });
    if (road.status !== "accepted") {
      building = null;
    }
  }

  const inventory = world.inventoryForPlayer(0);
  const planksBefore = inventory.resources[resourceType.plank];
  assert.equal(engine.dispatchConstructionLogistics(building, 0), true);
  assert.equal(
    inventory.resources[resourceType.plank],
    planksBefore - 2,
    "the lumberjack's two planks left the castle stock",
  );
});
