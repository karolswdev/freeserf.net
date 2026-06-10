import assert from "node:assert/strict";
import { test } from "node:test";
import { performance } from "node:perf_hooks";

import { SerfboundAiPlayer, startSerfboundLocalGame } from "@serfbound/engine";
import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
} from "@serfbound/app";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("a size-5 map with economy + AI sustains the scale budget", () => {
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    mapSize: 5,
    playerCount: 2,
    playerSupplies: [20, 20],
  });
  const world = started.game.world();
  const engine = started.game.serfEngine();
  const ai = new SerfboundAiPlayer(world, engine, 1, (action) =>
    started.game.state.recordWorldAction(action),
  );

  const begin = performance.now();
  const totalTicks = 200000;
  for (let tick = 16; tick <= totalTicks; tick += 16) {
    ai.update(tick);
    engine.update(tick);
  }

  const wallMs = performance.now() - begin;
  const ticksPerSecond = totalTicks / (wallMs / 1000);
  // The recorded budget is 200k ticks/s at size 6; this CI guard allows
  // slow runners a wide margin while still catching order-of-magnitude
  // regressions.
  assert.equal(
    ticksPerSecond > 100000,
    true,
    `size-5 sim too slow: ${Math.round(ticksPerSecond)} ticks/s`,
  );
});

test("the decoded scene builds inside the frame budget on a big map", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    mapSize: 5,
  });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());

  for (let i = 0; i < 3; i += 1) {
    createLandscapeScene({
      size: { width: 1280, height: 720 },
      assets,
      scroll: { column: 0, row: 0 },
      world,
    });
  }

  const begin = performance.now();
  for (let i = 0; i < 10; i += 1) {
    createLandscapeScene({
      size: { width: 1280, height: 720 },
      assets,
      scroll: { column: i, row: 0 },
      world,
    });
  }

  const averageMs = (performance.now() - begin) / 10;
  assert.equal(averageMs < 50, true, `scene build too slow: ${averageMs.toFixed(1)}ms`);
});
