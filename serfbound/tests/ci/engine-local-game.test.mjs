import assert from "node:assert/strict";
import { test } from "node:test";

import {
  deriveLocalGameSeedString,
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
