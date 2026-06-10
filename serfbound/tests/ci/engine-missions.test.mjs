import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findSerfboundMission,
  serfboundMissions,
  startSerfboundMission,
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

test("the campaign table matches Mission.cs exactly", () => {
  assert.equal(serfboundMissions.length, 31, "the reference mission table (30 classic + PYRDACOR)");

  const start = findSerfboundMission("START");
  assert.deepEqual(start, {
    name: "START",
    seedString: "8667715887436237",
    players: [
      { character: 12, intelligence: 40, supplies: 35, reproduction: 30, castle: null },
      { character: 1, intelligence: 10, supplies: 5, reproduction: 30, castle: null },
    ],
  });

  const acorn = findSerfboundMission("ACORN");
  assert.equal(acorn.seedString, "3183215728814883");
  assert.deepEqual(acorn.players[0].castle, { column: 28, row: 14 });
  assert.deepEqual(acorn.players[1].castle, { column: 5, row: 47 });

  const pyrdacor = serfboundMissions[serfboundMissions.length - 1];
  assert.equal(pyrdacor.name, "PYRDACOR");
  assert.equal(pyrdacor.players[0].supplies, 0);

  // Player 0 is always the human face (12) with intelligence 40. The 30
  // classic seeds use the 1-8 alphabet; PYRDACOR (the reference's own
  // bonus mission) carries digits outside it and stays listed but
  // unstartable until its seed handling is ported (recorded).
  for (const mission of serfboundMissions) {
    assert.equal(mission.players[0].character, 12, `${mission.name} human slot`);
    assert.equal(mission.players[0].intelligence, 40, `${mission.name} intelligence`);
    if (mission.name !== "PYRDACOR") {
      assert.match(mission.seedString, /^[1-8]{16}$/, `${mission.name} seed alphabet`);
    }
  }

  const pyrdacorStart = startSerfboundMission("PYRDACOR", dataSource);
  assert.equal(pyrdacorStart.status, "rejected", "PYRDACOR rejects recoverably");
});

test("starting a mission configures map seed, players, and supplies", () => {
  const result = startSerfboundMission("START", dataSource);
  assert.equal(result.status, "started");
  assert.equal(result.mission.name, "START");
  assert.equal(result.game.settings.seedString, "8667715887436237");
  assert.equal(result.game.settings.playerCount, 2);
  assert.deepEqual(result.game.settings.playerSupplies, [35, 5]);

  const world = result.game.world();
  assert.equal(world.players.length, 2, "both mission slots exist");

  // The human's castle stocks the mission preset when founded.
  let founded = false;
  for (let position = 0; position < world.tileCount && !founded; position += 1) {
    founded = world.buildCastle(position, 0) !== null;
  }

  assert.equal(founded, true);
  const expected = suppliesPresetResources(35);
  assert.equal(world.inventoryForPlayer(0).resources[7], expected[7], "supplies-35 preset");
});

test("pinned mission castles found for the AI slots and replay in saves", () => {
  const result = startSerfboundMission("ACORN", dataSource);
  assert.equal(result.status, "started");
  const world = result.game.world();

  assert.equal(world.players[1].hasCastle, true, "the AI castle founded");
  assert.notEqual(world.players[1].castlePosition, null);
  // Near the preset (5, 47): within the founding spiral.
  const preset = world.geometry.position(5, 47);
  const presetColumn = preset & world.geometry.columnMask;
  const castleColumn = world.players[1].castlePosition & world.geometry.columnMask;
  assert.equal(Math.abs(castleColumn - presetColumn) <= 12, true, "castle near the preset");

  // The founding is a recorded world action, so saves replay it.
  const actions = result.game.state.worldActions;
  assert.equal(
    actions.some((action) => action.kind === "build-castle" && action.player === 1),
    true,
    "AI castle recorded as a world action",
  );

  assert.equal(world.inventoryForPlayer(1) !== null, true, "the AI inventory exists");
});

test("unknown missions reject recoverably", () => {
  const result = startSerfboundMission("NOPE", dataSource);
  assert.equal(result.status, "rejected");
});
