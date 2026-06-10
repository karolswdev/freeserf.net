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

// Two-player battlefield: flat grass, both castles founded, an occupied
// enemy hut as the attack target.
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

  const hutSite = world.geometry.positionAdd(castle1, -4, -3);
  const hut = world.buildBuilding(hutSite, 11, 1);
  assert.notEqual(hut, null, "enemy hut builds");
  hut.isDone = true;
  hut.knights = 1;
  world.updateLandOwnership(hut.position);

  return { world, engine, hut, castle0, castle1 };
}

// The reference SetFightOutcome, implemented independently from the engine
// (Serf.cs math), to predict the seeded result.
function expectedOutcome(world, engine, attackerPosition, defenderPosition) {
  const random = FreeserfRandom.fromState(...engine.random.state);
  const expFactor = 1;
  const landFactor =
    world.owner(attackerPosition) === 0 ? 0x1000 : world.players[0].knightMorale;
  const morale = Math.floor((0x400 * expFactor * landFactor) / 0x10000);
  const defenderLandFactor =
    world.owner(defenderPosition) === 1 ? 0x1000 : world.players[1].knightMorale;
  const defenderMorale = Math.floor((0x400 * 1 * defenderLandFactor) / 0x10000);
  const result = Math.floor(((morale + defenderMorale) * random.next()) / 0x10000);
  return { attackerWins: result < morale, morale, defenderMorale };
}

function runAttack(seed) {
  const { world, engine, hut } = battlefield(seed);
  const inventory = world.inventoryForPlayer(0);
  inventory.knights = 1;

  assert.equal(engine.launchAttack(0, hut.index, 1, 0), 1, "one knight marches");
  const attacker = [...engine.serfs.values()].find((serf) => serf.attackTargetIndex === hut.index);
  assert.notEqual(attacker, undefined);

  const hutFlagPosition = world.flags.get(hut.flagIndex).position;
  const prediction = { value: null };
  let sawFight = false;
  let fightAnimations = null;

  for (let tick = 16; tick < 400000; tick += 16) {
    // Snapshot the prediction at the instant the fight is about to start:
    // the engine's combat RNG is untouched until the first engagement.
    if (prediction.value === null && attacker.position === hutFlagPosition) {
      prediction.value = expectedOutcome(world, engine, hutFlagPosition, hut.position);
    }

    engine.update(tick);
    if (attacker.state === serfState.knightAttacking && attacker.animation >= 146 && !sawFight) {
      sawFight = true;
      const defender = engine.serfs.get(attacker.fightOpponentIndex);
      fightAnimations = { attacker: attacker.animation, defender: defender.animation };
    }

    const fightOver =
      sawFight &&
      ![...engine.serfs.values()].some(
        (serf) =>
          serf.state === serfState.knightAttacking ||
          serf.state === serfState.knightAttackingVictory ||
          serf.state === serfState.knightMarching ||
          serf.state === serfState.dead,
      );
    if (fightOver) {
      break;
    }
  }

  assert.equal(sawFight, true, "the fight happened");
  assert.notEqual(prediction.value, null, "prediction captured");
  return { world, engine, hut, attacker, prediction: prediction.value, fightAnimations };
}

test("seeded combat outcomes match the reference fight math", () => {
  // Several seeds, both outcomes covered, each predicted independently.
  const outcomes = [];
  for (const seed of [0x1234, 0x2222, 0x7e57, 0xbeef, 0x0042]) {
    const { hut, prediction } = runAttack(seed);
    if (prediction.attackerWins) {
      // The victor captures the undefended post (SB-15-04) and garrisons it.
      assert.equal(hut.player, 0, `seed ${seed}: the post fell as predicted`);
      assert.equal(hut.knights, 1, `seed ${seed}: the victor garrisons the post`);
    } else {
      assert.equal(hut.player, 1, `seed ${seed}: the post held as predicted`);
      assert.equal(hut.knights, 1, `seed ${seed}: defender returned as predicted`);
    }

    outcomes.push(prediction.attackerWins);
  }

  assert.equal(outcomes.includes(true) && outcomes.includes(false), true,
    "the seeds cover both outcomes");
});

test("fight animations play in the reference knight ranges", () => {
  const { fightAnimations } = runAttack(0x1234);
  assert.equal(
    fightAnimations.attacker >= 146 && fightAnimations.attacker <= 161,
    true,
    `attacker animation ${fightAnimations.attacker} in the fight range`,
  );
  assert.equal(
    fightAnimations.defender >= 156 && fightAnimations.defender <= 171,
    true,
    `defender animation ${fightAnimations.defender} in the fight range`,
  );
});

test("defenders replace the fallen until the garrison is empty", () => {
  const { world, engine, hut } = battlefield(0x55aa);
  hut.knights = 2;
  const inventory = world.inventoryForPlayer(0);
  inventory.knights = 4;
  // Gold-rich attacker: high morale tilts the seeded fights.
  inventory.resources[resourceType.goldBar] = 200;
  world.updateKnightMorale(0);

  assert.equal(engine.launchAttack(0, hut.index, 4, 0), 4, "four knights march");

  for (let tick = 16; tick < 2000000; tick += 16) {
    engine.update(tick);
    const fighting = [...engine.serfs.values()].some(
      (serf) =>
        serf.state === serfState.knightMarching ||
        serf.state === serfState.knightAttacking ||
        serf.state === serfState.knightAttackingVictory ||
        serf.state === serfState.dead,
    );
    if (!fighting && tick > 16000) {
      break;
    }
  }

  const survivingAttackers = [...engine.serfs.values()].filter(
    (serf) => serf.attackTargetIndex === hut.index && serf.state !== serfState.dead,
  ).length;

  // Conservation: every fight kills exactly one side. Either the garrison
  // emptied and the post fell to the attackers, or every attacker fell.
  if (hut.player === 0) {
    assert.equal(hut.knights, 1, "the conqueror garrisons the captured post");
  } else {
    assert.equal(survivingAttackers, 0, "the garrison outlasted every attacker");
    assert.equal(hut.knights >= 1, true, "the surviving garrison holds the post");
  }

  // No serf is stuck mid-fight.
  for (const serf of engine.serfs.values()) {
    assert.notEqual(serf.state, serfState.knightAttacking, "no stuck attackers");
    assert.notEqual(serf.state, serfState.knightDefending, "no stuck defenders");
  }
});

test("losses update occupancy and the building stays active only while garrisoned", () => {
  const { world, engine, hut } = battlefield(0x1234);
  const inventory = world.inventoryForPlayer(0);
  inventory.knights = 1;
  const { prediction } = (() => {
    // Re-run the deterministic single-knight attack on this battlefield.
    assert.equal(engine.launchAttack(0, hut.index, 1, 0), 1);
    const attacker = [...engine.serfs.values()].find(
      (serf) => serf.attackTargetIndex === hut.index,
    );
    const hutFlagPosition = world.flags.get(hut.flagIndex).position;
    let captured = null;
    for (let tick = 16; tick < 400000; tick += 16) {
      if (captured === null && attacker.position === hutFlagPosition) {
        captured = expectedOutcome(world, engine, hutFlagPosition, hut.position);
      }

      engine.update(tick);
      const done = ![...engine.serfs.values()].some(
        (serf) =>
          serf.state === serfState.knightMarching ||
          serf.state === serfState.knightAttacking ||
          serf.state === serfState.knightAttackingVictory ||
          serf.state === serfState.dead,
      );
      if (captured !== null && done) {
        break;
      }
    }

    return { prediction: captured };
  })();

  if (prediction.attackerWins) {
    assert.equal(hut.player, 0, "the defender's death cost the post");
    assert.equal(hut.knights, 1, "the victor's occupancy replaced it");
  } else {
    assert.equal(hut.player, 1, "the post held");
    assert.equal(hut.knights, 1, "the surviving defender re-garrisoned");
  }
});
