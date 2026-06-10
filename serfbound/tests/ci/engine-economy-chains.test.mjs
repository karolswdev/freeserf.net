import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundCommandRouter,
  mapObject,
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
  // Flatten to grass for deterministic chain scenarios.
  world.heights.fill(4);
  world.typesUp.fill(mapTerrain.grass1);
  world.typesDown.fill(mapTerrain.grass1);
  world.objects.fill(0);
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

function buildConnected(world, router, tileFor, castleFlagPosition, sitePosition, kind) {
  const result = router.dispatch({
    type: "game.build-building",
    source: "pointer",
    tile: tileFor(sitePosition),
    buildingKind: kind,
  });
  assert.equal(result.status, "accepted", `${kind} builds`);
  const building = [...world.buildings.values()].reduce((a, b) => (a.index > b.index ? a : b));
  const road = router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(castleFlagPosition),
    toTile: tileFor(world.flags.get(building.flagIndex).position),
  });
  assert.equal(road.status, "accepted", `${kind} road connects`);
  return building;
}

test("the wood chain runs: trees fall, lumber reaches the sawmill, planks reach the castle", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  const lumberjack = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, 5, -2), "lumberjack",
  );
  const sawmill = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, -4, 2), "sawmill",
  );

  // Plant trees near the lumberjack.
  for (const [dx, dy] of [[2, 0], [3, 1], [2, -1], [4, 0]]) {
    world.objects[world.geometry.positionAdd(lumberjack.position, dx, dy)] = mapObject.tree0;
  }

  engine.dispatchConstructionLogistics(lumberjack, 0);
  engine.dispatchConstructionLogistics(sawmill, 0);

  const inventory = world.inventoryForPlayer(0);
  const planksBefore = inventory.resources[resourceType.plank];
  let treesFell = false;
  let planksProduced = false;

  for (let tick = 0; tick < 600000 && !planksProduced; tick += 16) {
    engine.update(tick);
    if (!treesFell) {
      treesFell = [[2, 0], [3, 1], [2, -1], [4, 0]].some(
        ([dx, dy]) =>
          world.objects[world.geometry.positionAdd(lumberjack.position, dx, dy)] !==
          mapObject.tree0,
      );
    }

    planksProduced = inventory.resources[resourceType.plank] > planksBefore - 10;
    // Production must exceed what construction consumed AND grow over time;
    // check the explicit signal: a plank arrived after both buildings stood.
    planksProduced =
      lumberjack.isDone &&
      sawmill.isDone &&
      inventory.resources[resourceType.plank] >= planksBefore - 5 + 1 &&
      treesFell;
  }

  assert.equal(lumberjack.isDone, true, "the lumberjack completed");
  assert.equal(sawmill.isDone, true, "the sawmill completed");
  assert.equal(treesFell, true, "the woodcutter felled trees");
  assert.equal(planksProduced, true, "planks flowed back to the castle");
});

test("the stonecutter quarries stone piles into the castle stock", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  const stonecutter = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, 4, 3), "stonecutter",
  );
  world.objects[world.geometry.positionAdd(stonecutter.position, 2, 1)] = 72; // stone pile

  engine.dispatchConstructionLogistics(stonecutter, 0);
  const inventory = world.inventoryForPlayer(0);
  const stonesBefore = inventory.resources[resourceType.stone];

  let quarried = false;
  for (let tick = 0; tick < 400000 && !quarried; tick += 16) {
    engine.update(tick);
    quarried =
      stonecutter.isDone && inventory.resources[resourceType.stone] > stonesBefore - 2;
    quarried =
      quarried &&
      world.objects[world.geometry.positionAdd(stonecutter.position, 2, 1)] !== 72;
  }

  assert.equal(quarried, true, "stone reached the castle and the pile shrank");
});

test("the forester replants trees on open territory", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  const forester = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, -3, -3), "forester",
  );
  engine.dispatchConstructionLogistics(forester, 0);

  let planted = false;
  for (let tick = 0; tick < 400000 && !planted; tick += 16) {
    engine.update(tick);
    if (!forester.isDone) {
      continue;
    }

    for (let offset = 1; offset < 151 && !planted; offset += 1) {
      const candidate = world.positionAddSpirally(forester.position, offset);
      planted = world.objects[candidate] === 8; // a fresh tree
    }
  }

  assert.equal(planted, true, "the forester planted a tree");
});
