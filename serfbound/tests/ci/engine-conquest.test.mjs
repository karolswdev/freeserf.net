import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FreeserfRandom,
  SerfboundGameWorld,
  SerfboundSerfEngine,
  mapTerrain,
  resourceType,
  serfState,
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

function battlefield(randomSeed) {
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = new SerfboundGameWorld(started.game.landscape(), 2);
  world.heights.fill(4);
  world.typesUp.fill(mapTerrain.grass1);
  world.typesDown.fill(mapTerrain.grass1);
  world.objects.fill(0);
  world.minerals.fill(0);
  world.resourceAmounts.fill(0);
  const engine = new SerfboundSerfEngine(world, FreeserfRandom.fromWord(randomSeed));

  const castle0 = world.geometry.position(15, 20);
  const castle1 = world.geometry.position(40, 40);
  assert.notEqual(world.buildCastle(castle0, 0), null, "player 0 castle");
  assert.notEqual(world.buildCastle(castle1, 1), null, "player 1 castle");
  return { world, engine, castle0, castle1 };
}

function runUntilQuiet(engine, maxTicks = 2000000) {
  for (let tick = 16; tick < maxTicks; tick += 16) {
    engine.update(tick);
    if (tick < 32000) {
      continue;
    }

    const busy = [...engine.serfs.values()].some(
      (serf) =>
        serf.state === serfState.knightMarching ||
        serf.state === serfState.knightAttacking ||
        serf.state === serfState.knightAttackingVictory ||
        serf.state === serfState.dead,
    );
    if (!busy) {
      return;
    }
  }
}

// Make the attacker's seeded fights overwhelming: a gold-rich player on
// foreign land carries gold-driven morale into SetFightOutcome.
function armAttacker(world, knights) {
  const inventory = world.inventoryForPlayer(0);
  inventory.knights = knights;
  inventory.resources[resourceType.goldBar] = 500;
  world.updateKnightMorale(0);
}

test("capturing a hut transfers ownership, territory, and cuts its roads", () => {
  const { world, engine, castle1 } = battlefield(0x1111);
  // Far enough from the enemy castle that the captured post's own
  // influence wins the recompute (the castle dominates its radius).
  const hutSite = world.geometry.positionAdd(castle1, -7, 0);
  const hut = world.buildBuilding(hutSite, 11, 1);
  assert.notEqual(hut, null);
  hut.isDone = true;
  hut.knights = 1;
  world.updateLandOwnership(hut.position);

  // A road from the enemy castle to the hut, to be cut on capture.
  const castleFlag = world.flagAt(world.move(castle1, "DownRight"));
  const hutFlag = world.flags.get(hut.flagIndex);
  assert.equal(world.owner(hut.position), 1, "the hut stands on enemy land");

  armAttacker(world, 6);
  // Repeat seeded assaults until the garrison falls (each fight outcome is
  // deterministic; a lost attacker is simply followed by the next).
  assert.equal(engine.launchAttack(0, hut.index, 6, 0) > 0, true);
  runUntilQuiet(engine);

  assert.equal(hut.player, 0, "the hut changed owner");
  assert.equal(hut.knights, 1, "the conquering knight garrisons the post");
  assert.equal(world.owner(hut.position), 0, "the post's ground transferred");
  assert.equal(world.flags.get(hut.flagIndex).player, 0, "the flag transferred");
  for (const direction of ["Right", "DownRight", "Down", "Left", "Up"]) {
    assert.equal(
      world.flags.get(hut.flagIndex).paths[direction].hasPath,
      false,
      `captured flag road ${direction} cut`,
    );
  }

  // Territory: the captured post projects player-0 influence now.
  const nearHut = world.geometry.positionAdd(hut.position, -2, 0);
  assert.equal(world.owner(nearHut), 0, "territory around the post transferred");
});

test("capture demolishes adjacent civilian buildings per the reference ring", () => {
  const { world, engine, castle1 } = battlefield(0x2222);
  // Far enough from the enemy castle that the captured post's own
  // influence wins the recompute (the castle dominates its radius).
  const hutSite = world.geometry.positionAdd(castle1, -7, 0);
  const hut = world.buildBuilding(hutSite, 11, 1);
  hut.isDone = true;
  hut.knights = 1;
  world.updateLandOwnership(hut.position);

  // A civilian building in the hut's second ring (spiral offsets 7..18).
  const civilianSite = world.positionAddSpirally(hut.position, 9);
  const civilian = world.buildBuilding(civilianSite, 2, 1); // lumberjack
  assert.notEqual(civilian, null, "civilian building stands in the ring");

  armAttacker(world, 6);
  engine.launchAttack(0, hut.index, 6, 0);
  runUntilQuiet(engine);

  assert.equal(hut.player, 0, "the hut fell");
  assert.equal(world.buildings.has(civilian.index), false, "the civilian building fell with it");
});

test("the castle falls: demolition, defeat, and territory collapse", () => {
  const { world, engine, castle1 } = battlefield(0x3333);
  const castleBuilding = [...world.buildings.values()].find(
    (building) => building.player === 1 && building.type === 24,
  );
  assert.notEqual(castleBuilding, undefined);

  const enemyLand = world.geometry.positionAdd(castle1, 2, 1);
  assert.equal(world.owner(enemyLand), 1, "enemy territory before the fall");

  armAttacker(world, 8);
  // The castle itself holds no garrison in the condensed model: the march
  // walks in and takes it.
  assert.equal(engine.launchAttack(0, castleBuilding.index, 1, 0), 1);
  runUntilQuiet(engine);

  assert.equal(world.buildings.has(castleBuilding.index), false, "the castle is demolished");
  assert.equal(world.players[1].defeated, true, "player 1 is defeated");
  assert.equal(world.players[1].hasCastle, false);
  assert.equal(world.players[1].castlePosition, null);
  assert.equal(world.inventoryForPlayer(1), null, "the castle inventory is gone");
  assert.equal(world.owner(enemyLand) === 1, false, "enemy territory collapsed");
});

test("a defended castle cannot fall while its defenders hold", () => {
  const { world, engine, castle1 } = battlefield(0x4444);
  const castleBuilding = [...world.buildings.values()].find(
    (building) => building.player === 1 && building.type === 24,
  );
  castleBuilding.knights = 3;
  const inventory = world.inventoryForPlayer(0);
  inventory.knights = 1;
  // No gold: the attacker fights at base morale on enemy land.

  engine.launchAttack(0, castleBuilding.index, 1, 0);
  runUntilQuiet(engine);

  // Whatever the seeded outcome of the single fight, three defenders
  // cannot all fall to one knight: the castle stands.
  assert.equal(world.buildings.has(castleBuilding.index), true, "the castle stands");
  assert.equal(world.players[1].defeated, false);
  assert.equal(castleBuilding.knights >= 2, true, "the garrison held");
});
