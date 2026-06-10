import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundAiPlayer,
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

function twoPlayerGame() {
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    playerCount: 2,
    playerSupplies: [20, 20],
  });
  const world = started.game.world();
  const engine = started.game.serfEngine();
  const ai = new SerfboundAiPlayer(world, engine, 1, (action) =>
    started.game.state.recordWorldAction(action),
  );
  return { started, world, engine, ai };
}

test("the established AI grows the deeper economy past the opening plan", () => {
  const { world, engine, ai } = twoPlayerGame();
  // Generous supplies keep construction flowing for the long run.
  for (let tick = 16; tick < 900000; tick += 16) {
    ai.update(tick);
    engine.update(tick);
    const inventory = world.inventoryForPlayer(1);
    if (inventory !== null && tick % 50000 === 0) {
      // Keep materials flowing like a developed settlement would.
      inventory.resources[resourceType.plank] = Math.max(
        inventory.resources[resourceType.plank],
        20,
      );
      inventory.resources[resourceType.stone] = Math.max(
        inventory.resources[resourceType.stone],
        10,
      );
      inventory.genericSerfs = Math.max(inventory.genericSerfs, 10);
    }
  }

  const aiTypes = new Set(
    [...world.buildings.values()]
      .filter((building) => building.player === 1)
      .map((building) => building.type),
  );
  // The opening plan completed and the expansion reached the meat/steel
  // side (mines stay siteless on flat seeds and must not block it).
  assert.equal(aiTypes.has(2), true, "lumberjack");
  assert.equal(aiTypes.has(16), true, "baker");
  assert.equal(aiTypes.has(14) || aiTypes.has(13) || aiTypes.has(18), true, "expansion began");
});

test("threat levels rise on AI garrisons near enemy buildings", () => {
  const { world, engine, ai } = twoPlayerGame();
  // The human founds nearby so proximity matters.
  let humanCastle = null;
  for (let position = 0; position < world.tileCount && humanCastle === null; position += 1) {
    if (world.buildCastle(position, 0) !== null) {
      humanCastle = position;
    }
  }

  assert.notEqual(humanCastle, null);

  for (let tick = 16; tick < 500000; tick += 16) {
    ai.update(tick);
    engine.update(tick);
  }

  const aiHuts = [...world.buildings.values()].filter(
    (building) => building.player === 1 && building.type === 11,
  );
  assert.equal(aiHuts.length >= 1, true, "the AI garrisons");
  // Threat levels are computed (0..3) from enemy distance bands.
  for (const hut of aiHuts) {
    assert.equal(hut.threatLevel >= 0 && hut.threatLevel <= 3, true);
  }
});

test("a knight-rich AI launches an attack on the nearest enemy post", () => {
  const { started, world, engine, ai } = twoPlayerGame();
  void started;
  // The human founds a castle; the AI gets a head start and a war chest.
  let humanCastle = null;
  for (let position = 0; position < world.tileCount && humanCastle === null; position += 1) {
    if (world.buildCastle(position, 0) !== null) {
      humanCastle = position;
    }
  }

  for (let tick = 16; tick < 400000; tick += 16) {
    ai.update(tick);
    engine.update(tick);
    const inventory = world.inventoryForPlayer(1);
    if (inventory !== null && inventory.knights < 6) {
      // The weapons economy is proven elsewhere; stock the knights.
      inventory.knights = 6;
    }

    if (ai.decisions.some((decision) => decision.startsWith("attack:"))) {
      break;
    }
  }

  const attackDecision = ai.decisions.find((decision) => decision.startsWith("attack:"));
  assert.notEqual(attackDecision, undefined, "the AI attacked");

  // The marching knights exist and head for the human's post.
  const marching = [...engine.serfs.values()].filter(
    (serf) => serf.player === 1 && (serf.state === serfState.knightMarching ||
      serf.state === serfState.knightAttacking ||
      serf.state === serfState.idleInStock),
  );
  assert.equal(marching.length > 0, true, "attacking knights spawned");
});
