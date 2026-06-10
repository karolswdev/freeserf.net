import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundCommandRouter,
  mapTerrain,
  militaryGoldCap,
  militaryKnightsNeeded,
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

test("occupancy tables match the reference fixtures", () => {
  const defaults = [0x10, 0x21, 0x32, 0x43];
  // Threat level 0 (interior): occupation level 1.
  assert.equal(militaryKnightsNeeded({ type: 11, threatLevel: 0 }, defaults), 1);
  assert.equal(militaryKnightsNeeded({ type: 21, threatLevel: 0 }, defaults), 2);
  assert.equal(militaryKnightsNeeded({ type: 22, threatLevel: 0 }, defaults), 3);
  // Threat level 3 (frontier): occupation level 4 — full garrisons.
  assert.equal(militaryKnightsNeeded({ type: 11, threatLevel: 3 }, defaults), 3);
  assert.equal(militaryKnightsNeeded({ type: 21, threatLevel: 3 }, defaults), 6);
  assert.equal(militaryKnightsNeeded({ type: 22, threatLevel: 3 }, defaults), 12);
  // Gold stock caps.
  assert.equal(militaryGoldCap(11), 2);
  assert.equal(militaryGoldCap(21), 4);
  assert.equal(militaryGoldCap(22), 8);
});

test("a hut requests its garrison and the first knight grows the border", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");
  const inventory = world.inventoryForPlayer(0);
  // Weapons for recruitment: the castle stocks knights, the hut draws them.
  inventory.resources[resourceType.sword] = 10;
  inventory.resources[resourceType.shield] = 10;

  const hut = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, 5, -2), "hut",
  );
  engine.dispatchConstructionLogistics(hut, 0);

  // A position beyond the castle's radius-8 influence, near the hut.
  const frontier = world.geometry.positionAdd(castlePosition, 11, -3);
  assert.equal(world.hasOwner(frontier), false, "frontier starts unowned");
  const landBefore = world.players[0].landArea;
  const bordersBefore = world.borderSegments().length;

  let occupied = false;
  for (let tick = 0; tick < 600000 && !occupied; tick += 16) {
    engine.update(tick);
    occupied = hut.knights > 0;
  }

  assert.equal(hut.isDone, true, "the hut completed");
  assert.equal(occupied, true, "a knight garrisoned the hut");
  // Threat level 0 hut wants exactly one knight.
  assert.equal(hut.knights, 1, "the interior hut holds one knight");
  assert.equal(hut.requestedKnights, 0, "no phantom requests remain");
  assert.equal(world.hasOwner(frontier), true, "territory grew past the castle radius");
  assert.equal(world.owner(frontier), 0);
  assert.equal(world.players[0].landArea > landBefore, true, "land area grew");
  assert.notEqual(world.borderSegments().length, bordersBefore, "borders re-rendered");
});

test("an unoccupied military building projects no territory", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");
  const inventory = world.inventoryForPlayer(0);
  // No weapons: knights can never be recruited, the hut stays empty.
  inventory.resources[resourceType.sword] = 0;
  inventory.resources[resourceType.shield] = 0;

  const hut = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, 5, -2), "hut",
  );
  engine.dispatchConstructionLogistics(hut, 0);

  const frontier = world.geometry.positionAdd(castlePosition, 11, -3);
  for (let tick = 0; tick < 400000 && !hut.isDone; tick += 16) {
    engine.update(tick);
  }

  // Let the sweep run a while longer with the hut done but empty.
  for (let tick = 400000; tick < 500000; tick += 16) {
    engine.update(tick);
  }

  assert.equal(hut.isDone, true, "the hut completed");
  assert.equal(hut.knights, 0, "no knights without weapons");
  assert.equal(world.hasOwner(frontier), false, "no territory from an empty hut");
});

test("higher threat levels fill larger garrisons from the occupation setting", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");
  const inventory = world.inventoryForPlayer(0);
  inventory.resources[resourceType.sword] = 20;
  inventory.resources[resourceType.shield] = 20;
  inventory.genericSerfs += 20;

  const tower = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, 5, 3), "tower",
  );
  tower.threatLevel = 3; // frontier post: wants the full six knights
  engine.dispatchConstructionLogistics(tower, 0);

  let filled = false;
  for (let tick = 0; tick < 1200000 && !filled; tick += 16) {
    engine.update(tick);
    filled = tower.knights === 6;
  }

  assert.equal(tower.isDone, true, "the tower completed");
  assert.equal(filled, true, "the frontier tower filled to six knights");
  assert.equal(tower.requestedKnights, 0);
});

test("gold bars route to occupied posts and count toward morale", () => {
  const { started, world, router, tileFor, castlePosition } = foundedGame();
  const engine = started.game.serfEngine();
  const castleFlagPosition = world.move(castlePosition, "DownRight");
  const inventory = world.inventoryForPlayer(0);
  inventory.resources[resourceType.sword] = 10;
  inventory.resources[resourceType.shield] = 10;

  const hut = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, 5, -2), "hut",
  );
  const smelter = buildConnected(
    world, router, tileFor, castleFlagPosition,
    world.geometry.positionAdd(castlePosition, -4, 2), "goldSmelter",
  );
  engine.dispatchConstructionLogistics(hut, 0);
  engine.dispatchConstructionLogistics(smelter, 0);

  let goldDelivered = false;
  for (let tick = 0; tick < 1200000 && !goldDelivered; tick += 16) {
    engine.update(tick);
    if (smelter.isDone && (smelter.deliveredResources[resourceType.coal] ?? 0) === 0) {
      smelter.deliveredResources[resourceType.coal] = 3;
      smelter.deliveredResources[resourceType.goldOre] = 3;
    }

    goldDelivered = (hut.deliveredResources[resourceType.goldBar] ?? 0) > 0;
  }

  assert.equal(goldDelivered, true, "a gold bar reached the occupied hut");
  // The hut's gold stock cap is 2: in-flight + delivered never exceeds it.
  assert.equal(
    (hut.deliveredResources[resourceType.goldBar] ?? 0) +
      (hut.requestedResources[resourceType.goldBar] ?? 0) <= 2,
    true,
    "hut gold respects the reference cap",
  );

  world.updateKnightMorale(0);
  assert.equal(
    world.players[0].goldDeposited >=
      (hut.deliveredResources[resourceType.goldBar] ?? 0),
    true,
    "military gold counts in the morale depot",
  );
});
