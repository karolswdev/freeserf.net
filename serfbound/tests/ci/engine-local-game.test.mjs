import assert from "node:assert/strict";
import { test } from "node:test";

import {
  deriveLocalGameSeedString,
  restoreSerfboundLocalGame,
  startSerfboundLocalGame,
} from "@serfbound/engine";

const generatedCatalogData = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 32,
  entryCount: 2,
  definedArchiveEntries: 2,
  fixupCount: 0,
};

test("startSerfboundLocalGame initializes deterministic state from imported data", () => {
  const result = startSerfboundLocalGame({
    data: generatedCatalogData,
  });

  assert.equal(deriveLocalGameSeedString(generatedCatalogData, 3), "3128716831287168");
  assert.equal(result.status, "started");
  assert.deepEqual(result.snapshot, {
    schemaVersion: 1,
    kind: "serfbound.local-game",
    mode: "local-single-player",
    status: "running",
    data: generatedCatalogData,
    settings: {
      mapSize: 3,
      seedString: "3128716831287168",
      initialSupplies: 20,
    },
    state: {
      schemaVersion: 1,
      kind: "serfbound.game-state-skeleton",
      map: {
        size: 3,
        columns: 64,
        rows: 64,
        tileCount: 4096,
      },
      clock: {
        tick: 0,
        constTick: 0,
        gameTimeTicksOfSecond: 0,
        gameTime: 0,
        gameSpeed: 2,
        nextGameTime: 0,
        tickDifference: 0,
      },
      random: {
        state: [28226, 17140, 62574],
        seedString: "3128716831287168",
      },
      counters: {
        knightMoraleCounter: 0,
        inventoryScheduleCounter: 0,
      },
      builtStructures: [],
    worldActions: [],
    },
    renderer: {
      sceneSource: "dos-pa-catalog",
    },
  });
  assert.deepEqual(result.game.snapshot(), result.snapshot);
});

test("startSerfboundLocalGame rejects missing data and invalid settings", () => {
  assert.deepEqual(startSerfboundLocalGame({}), {
    status: "rejected",
    reason: "missing-imported-data",
    message: "A local Serfbound game requires imported SPAU.PA catalog data.",
  });

  assert.deepEqual(startSerfboundLocalGame({
    data: generatedCatalogData,
    mapSize: 0,
  }), {
    status: "rejected",
    reason: "invalid-map-size",
    message: "Local game map size must be an integer from 1 through 23.",
  });

  assert.deepEqual(startSerfboundLocalGame({
    data: generatedCatalogData,
    seedString: "bad-seed",
  }), {
    status: "rejected",
    reason: "invalid-seed",
    message: "Local game seed must contain 16 digits from 1 to 8.",
  });
});

test("restoreSerfboundLocalGame resumes a saved first-slice snapshot", () => {
  const started = startSerfboundLocalGame({
    data: generatedCatalogData,
  });
  assert.equal(started.status, "started");
  started.game.state.buildFlag({ column: 27, row: 21, position: 1371 });
  started.game.state.advanceTicks(4);

  const savedSnapshot = started.game.snapshot();
  const restored = restoreSerfboundLocalGame(savedSnapshot);

  assert.equal(restored.status, "started");
  assert.deepEqual(restored.snapshot, savedSnapshot);
  assert.deepEqual(restored.game.state.builtStructures, [
    {
      id: 1,
      kind: "flag",
      placedAtTick: 0,
      tile: { column: 27, row: 21, position: 1371 },
    },
  ]);

  started.game.state.advanceTicks(3);
  restored.game.state.advanceTicks(3);
  assert.deepEqual(restored.game.snapshot(), started.game.snapshot());
});

test("restoreSerfboundLocalGame rejects corrupt saved snapshots recoverably", () => {
  assert.deepEqual(restoreSerfboundLocalGame(null), {
    status: "rejected",
    reason: "invalid-snapshot",
    message: "Saved local game data is not a Serfbound local game snapshot.",
  });

  const started = startSerfboundLocalGame({
    data: generatedCatalogData,
  });
  assert.equal(started.status, "started");

  assert.deepEqual(
    restoreSerfboundLocalGame({
      ...started.snapshot,
      settings: { ...started.snapshot.settings, seedString: "bad-seed" },
    }),
    {
      status: "rejected",
      reason: "invalid-seed",
      message: "Saved local game seed is invalid.",
    },
  );

  assert.deepEqual(
    restoreSerfboundLocalGame({
      ...started.snapshot,
      state: { ...started.snapshot.state, random: { state: null } },
    }),
    {
      status: "rejected",
      reason: "invalid-snapshot",
      message: "Saved local game state could not be restored.",
    },
  );
});
