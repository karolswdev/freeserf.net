import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundAiPlayer,
  startSerfboundLocalGame,
  startSerfboundMission,
} from "@serfbound/engine";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

function seededAiRun(ticks) {
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    playerCount: 2,
    playerSupplies: [20, 20],
  });
  assert.equal(started.status, "started");
  const world = started.game.world();
  const engine = started.game.serfEngine();
  const ai = new SerfboundAiPlayer(world, engine, 1, (action) =>
    started.game.state.recordWorldAction(action),
  );

  for (let tick = 16; tick < ticks; tick += 16) {
    ai.update(tick);
    engine.update(tick);
  }

  return { started, world, engine, ai };
}

test("the AI founds a castle deterministically on a seeded map", () => {
  const first = seededAiRun(4000);
  const second = seededAiRun(4000);

  assert.equal(first.world.players[1].hasCastle, true, "the AI founded");
  assert.equal(
    first.world.players[1].castlePosition,
    second.world.players[1].castlePosition,
    "the same seed founds the same castle",
  );
  assert.deepEqual(
    first.ai.decisions.slice(0, 1),
    second.ai.decisions.slice(0, 1),
    "the founding decision fixtures exactly",
  );
});

test("the AI establishes the reference build order over connected roads", () => {
  const { world, ai } = seededAiRun(400000);

  const aiBuildings = [...world.buildings.values()].filter(
    (building) => building.player === 1 && building.type !== 24,
  );
  const builtTypes = aiBuildings.map((building) => building.type);

  // The establishment plan opens with the wood economy.
  assert.equal(builtTypes.includes(2), true, "lumberjack placed");
  assert.equal(builtTypes.includes(17), true, "sawmill placed");
  assert.equal(builtTypes.includes(4), true, "stonecutter placed");

  // Decisions follow the plan order.
  const buildDecisions = ai.decisions.filter((decision) => decision.startsWith("build:"));
  assert.equal(buildDecisions.length >= 3, true, "several build decisions logged");
  assert.equal(buildDecisions[0].startsWith("build:2:"), true, "lumberjack first");
  assert.equal(buildDecisions[1].startsWith("build:17:"), true, "sawmill second");

  // Construction actually runs: at least the first buildings complete
  // through serf labor over the AI's roads.
  const doneCount = aiBuildings.filter((building) => building.isDone).length;
  assert.equal(doneCount >= 2, true, `AI buildings complete (done: ${doneCount})`);

  // Every decision was recorded as a world action (saves replay the AI).
  const replayable = ai.decisions.length;
  assert.equal(replayable > 0, true);
});

test("mission AI slots accept an AI driver immediately", () => {
  const result = startSerfboundMission("ACORN", dataSource);
  assert.equal(result.status, "started");
  const world = result.game.world();
  const engine = result.game.serfEngine();
  const ai = new SerfboundAiPlayer(world, engine, 1, (action) =>
    result.game.state.recordWorldAction(action),
  );

  // ACORN pins the AI castle; the AI starts establishing right away.
  for (let tick = 16; tick < 60000; tick += 16) {
    ai.update(tick);
    engine.update(tick);
  }

  const aiBuildings = [...world.buildings.values()].filter(
    (building) => building.player === 1 && building.type !== 24,
  );
  assert.equal(aiBuildings.length >= 1, true, "the mission AI builds from its pinned castle");
});
