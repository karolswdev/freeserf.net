import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundCommandRouter,
  restoreSerfboundLocalGame,
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

function tileFor(world, position) {
  return {
    column: position & world.geometry.columnMask,
    row: (position >>> world.geometry.rowShift) & world.geometry.rowMask,
    position,
  };
}

function findCastleSpot(world) {
  for (let position = 0; position < world.tileCount; position += 1) {
    if (world.canBuildCastle(position, 0)) {
      return position;
    }
  }

  throw new Error("no castle spot on this map");
}

function startedGameWithCastle() {
  const started = startSerfboundLocalGame({ data: dataSource });
  assert.equal(started.status, "started");
  const world = started.game.world();
  const router = new SerfboundCommandRouter(started.game.state, world);
  const castlePosition = findCastleSpot(world);
  const result = router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: tileFor(world, castlePosition),
  });
  assert.equal(result.status, "accepted");
  assert.equal(result.effect, "castle-built");
  return { started, world, router, castlePosition };
}

test("the castle command claims territory and unlocks building", () => {
  const { world, router, castlePosition } = startedGameWithCastle();

  assert.equal(world.players[0].hasCastle, true);
  assert.equal(world.players[0].castlePosition, castlePosition);
  assert.equal(world.owner(castlePosition), 0, "castle tile is owned");
  assert.equal(world.players[0].landArea > 100, true, "territory claimed around the castle");

  // A second castle is rejected.
  const again = router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: tileFor(world, world.geometry.positionAdd(castlePosition, 10, 10)),
  });
  assert.equal(again.status, "rejected");
  assert.equal(again.reason, "invalid-build-position");

  // Snapshot carries world facts.
  assert.equal(again.snapshot.world.hasCastle, true);
  assert.equal(again.snapshot.world.flagCount, 1, "the castle flag exists");
});

test("flags, roads, and buildings build inside territory via commands", () => {
  const { world, router, castlePosition } = startedGameWithCastle();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  // Find a flag spot inside territory.
  let flagPosition = -1;
  for (let radius = 2; radius < 8 && flagPosition < 0; radius += 1) {
    for (let offset = 0; offset < 100; offset += 1) {
      const candidate = world.positionAddSpirally(castleFlagPosition, offset);
      if (candidate !== castleFlagPosition && world.canBuildFlag(candidate, 0)) {
        flagPosition = candidate;
        break;
      }
    }
  }
  assert.notEqual(flagPosition, -1, "a flag spot exists in territory");

  const flagResult = router.dispatch({
    type: "game.build-flag",
    source: "pointer",
    tile: tileFor(world, flagPosition),
  });
  assert.equal(flagResult.status, "accepted");
  assert.equal(flagResult.effect, "world-flag-built");

  const roadResult = router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(world, castleFlagPosition),
    toTile: tileFor(world, flagPosition),
  });
  assert.equal(roadResult.status, "accepted", roadResult.message ?? "");
  assert.equal(roadResult.effect, "road-built");
  assert.equal(world.flagAt(castleFlagPosition).paths !== undefined, true);

  // Find a lumberjack site.
  let sitePosition = -1;
  for (let offset = 0; offset < 200; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (world.canBuildBuilding(candidate, 2, 0)) {
      sitePosition = candidate;
      break;
    }
  }

  if (sitePosition >= 0) {
    const buildResult = router.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: tileFor(world, sitePosition),
      buildingKind: "lumberjack",
    });
    assert.equal(buildResult.status, "accepted");
    assert.equal(buildResult.effect, "building-built");
    assert.equal(buildResult.snapshot.world.buildingCount, 2, "castle + lumberjack");
  }

  // Commands outside territory are rejected.
  const outside = router.dispatch({
    type: "game.build-flag",
    source: "pointer",
    tile: tileFor(world, world.geometry.positionAdd(castlePosition, 30, 30)),
  });
  assert.equal(outside.status, "rejected");
});

test("saved games replay world actions to identical world state", () => {
  const { started, world, router, castlePosition } = startedGameWithCastle();
  const castleFlagPosition = world.move(castlePosition, "DownRight");

  let flagPosition = -1;
  for (let offset = 0; offset < 100; offset += 1) {
    const candidate = world.positionAddSpirally(castleFlagPosition, offset);
    if (candidate !== castleFlagPosition && world.canBuildFlag(candidate, 0)) {
      flagPosition = candidate;
      break;
    }
  }
  router.dispatch({
    type: "game.build-flag",
    source: "pointer",
    tile: tileFor(world, flagPosition),
  });
  router.dispatch({
    type: "game.build-road",
    source: "pointer",
    tile: tileFor(world, castleFlagPosition),
    toTile: tileFor(world, flagPosition),
  });

  const saved = started.game.snapshot();
  assert.equal(saved.state.worldActions.length, 3, "castle + flag + road actions recorded");

  const restored = restoreSerfboundLocalGame(saved);
  assert.equal(restored.status, "started");
  const replayedWorld = restored.game.world();

  assert.deepEqual(Array.from(replayedWorld.paths), Array.from(world.paths), "paths identical");
  assert.deepEqual(Array.from(replayedWorld.owners), Array.from(world.owners), "owners identical");
  assert.deepEqual(Array.from(replayedWorld.objects), Array.from(world.objects), "objects identical");
  assert.equal(replayedWorld.flags.size, world.flags.size);
  assert.equal(replayedWorld.buildings.size, world.buildings.size);
  assert.equal(replayedWorld.players[0].hasCastle, true);
});

test("interim construction progresses by ticks and survives save/restore mid-build", () => {
  const { started, world, router, castlePosition } = startedGameWithCastle();

  let sitePosition = -1;
  for (let offset = 0; offset < 250; offset += 1) {
    const candidate = world.positionAddSpirally(castlePosition, offset);
    if (world.canBuildBuilding(candidate, 2, 0)) {
      sitePosition = candidate;
      break;
    }
  }
  assert.notEqual(sitePosition, -1, "a lumberjack site exists");

  // Advance the clock before building so startTick is non-zero.
  for (let step = 0; step < 10; step += 1) {
    started.game.state.advanceTick();
  }
  const startTick = started.game.state.tick;

  const buildResult = router.dispatch({
    type: "game.build-building",
    source: "pointer",
    tile: tileFor(world, sitePosition),
    buildingKind: "lumberjack",
  });
  assert.equal(buildResult.status, "accepted");

  const building = [...world.buildings.values()].find((candidate) => candidate.type === 2);
  assert.equal(building.startTick, startTick);
  assert.equal(building.progress, 0, "site starts leveling");

  // Frame stage after 40 ticks.
  world.advanceConstruction(startTick + 40);
  assert.equal(building.progress, 1, "frame stands");
  assert.equal(building.isDone, false);

  // Done after 120 ticks.
  world.advanceConstruction(startTick + 120);
  assert.equal(building.isDone, true);

  // Save mid-build (rewind a fresh game to mid-state): replaying the action
  // log with the saved tick restores identical construction state.
  const saved = started.game.snapshot();
  const restored = restoreSerfboundLocalGame(saved);
  assert.equal(restored.status, "started");
  const replayed = restored.game.world();
  const replayedBuilding = [...replayed.buildings.values()].find(
    (candidate) => candidate.type === 2,
  );
  assert.equal(replayedBuilding.startTick, startTick);
  // The saved clock had not advanced past startTick + 10 steps' worth, so the
  // replayed world reflects the clock, not our manual advance calls.
  assert.equal(
    replayedBuilding.isDone,
    saved.state.clock.tick - startTick >= 120,
    "completion derives from the saved clock",
  );
});
