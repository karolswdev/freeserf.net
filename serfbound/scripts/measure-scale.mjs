// SB-19-01: performance at scale — headless measurements of the full
// simulation (economy + AI) across map sizes, plus decoded scene build
// timing at desktop resolution. Writes the phase-19 artifact JSON.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const workspaceRoot = new URL("..", import.meta.url).pathname;
const outputPath = resolve(
  workspaceRoot,
  "../pm/roadmap/serfbound/phase-19-browser-experience/artifacts/sb-19-01-scale-baseline.json",
);

const { SerfboundAiPlayer, startSerfboundLocalGame } = await import(
  "../packages/engine/dist/index.js"
);
const { buildDecodedRenderAssets, buildLandscapeRenderAssets, createLandscapeScene } =
  await import("../packages/app/dist/main.js");
const { createDecodableGeneratedPaArchive } = await import(
  "../packages/test-support/dist/index.js"
);

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const simulations = [];
for (const mapSize of [3, 4, 5, 6]) {
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    mapSize,
    playerCount: 2,
    playerSupplies: [20, 20],
  });
  const world = started.game.world();
  const engine = started.game.serfEngine();
  const ai = new SerfboundAiPlayer(world, engine, 1, (action) =>
    started.game.state.recordWorldAction(action),
  );

  const heapBefore = process.memoryUsage().heapUsed;
  const begin = performance.now();
  const totalTicks = 500000;
  for (let tick = 16; tick <= totalTicks; tick += 16) {
    ai.update(tick);
    engine.update(tick);
  }

  const wallMs = performance.now() - begin;
  const heapAfter = process.memoryUsage().heapUsed;
  simulations.push({
    mapSize,
    columns: world.columns,
    rows: world.rows,
    totalTicks,
    wallMs: Math.round(wallMs * 10) / 10,
    ticksPerSecond: Math.round(totalTicks / (wallMs / 1000)),
    heapBeforeMb: Math.round(heapBefore / 1e5) / 10,
    heapAfterMb: Math.round(heapAfter / 1e5) / 10,
    aiBuildings: [...world.buildings.values()].filter((b) => b.player === 1).length,
    serfs: engine.serfs.size,
  });
}

// Scene build timing at desktop resolution over a live world.
const sceneRuns = [];
const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
for (const mapSize of [3, 5]) {
  const started = startSerfboundLocalGame({
    data: dataSource,
    seedString: "1234567812345678",
    mapSize,
  });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());
  // Warm up, then measure 30 builds.
  for (let i = 0; i < 3; i += 1) {
    createLandscapeScene({ size: { width: 1280, height: 720 }, assets, scroll: { column: 0, row: 0 }, world });
  }

  const begin = performance.now();
  const builds = 30;
  for (let i = 0; i < builds; i += 1) {
    createLandscapeScene({
      size: { width: 1280, height: 720 },
      assets,
      scroll: { column: i % world.columns, row: 0 },
      world,
      panel: { buttons: [0, 8, 10, 12, 14] },
    });
  }

  const wallMs = performance.now() - begin;
  sceneRuns.push({
    mapSize,
    builds,
    averageBuildMs: Math.round((wallMs / builds) * 100) / 100,
  });
}

const result = {
  schemaVersion: 1,
  kind: "serfbound.scale-baseline",
  measuredAtIso: new Date().toISOString(),
  budgets: {
    // The 175 ms frame drives 8 ticks; the sim must stay far below it.
    minTicksPerSecondAtSize6: 200000,
    maxSceneBuildMsAt1280: 50,
  },
  simulations,
  sceneRuns,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(result, null, 2));
const worst = simulations[simulations.length - 1];
console.log(
  `scale-baseline-ok: size6 ${worst.ticksPerSecond} ticks/s; scene builds ${sceneRuns
    .map((run) => `size${run.mapSize}=${run.averageBuildMs}ms`)
    .join(", ")}; saved ${outputPath}`,
);
