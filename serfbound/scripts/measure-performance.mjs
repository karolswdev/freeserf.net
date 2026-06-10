import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const workspaceRoot = new URL("..", import.meta.url).pathname;
const repoRoot = resolve(workspaceRoot, "..");
const outputPath = resolve(
  workspaceRoot,
  process.env["SERFBOUND_PERF_OUTPUT"] ??
    "../pm/roadmap/serfbound/phase-8-browser-hardening/artifacts/story-01-performance-baseline-local.json",
);
const port = Number.parseInt(process.env["SERFBOUND_PERF_PORT"] ?? "4184", 10);
const baseURL = `http://127.0.0.1:${port}/`;
const localSpauPath =
  process.env["SERFBOUND_PERF_SPAU_PA"] ?? process.env["SERFBOUND_SPAU_PA"];

const { SerfboundGameState } = await import("../packages/engine/dist/index.js");

const result = {
  schemaVersion: 1,
  kind: "serfbound.performance-baseline",
  measuredAtIso: new Date().toISOString(),
  source: {
    command: "npm run measure:performance",
    workspaceRoot,
    baseURL,
  },
  environment: await collectNodeEnvironment(),
  budgets: {
    simulationTickAverageMs: 0.05,
    browserFrameP95Ms: 20,
    importLocalSpauMs: 1000,
    saveMs: 100,
    reloadAndLoadMs: 1000,
  },
  measurements: {},
  stopSignals: [
    "Simulation tick average exceeds 0.05 ms on the first playable slice.",
    "Browser requestAnimationFrame p95 exceeds 20 ms on desktop Chromium.",
    "Local SPAU.PA import exceeds 1000 ms on the representative local machine.",
    "Browser save exceeds 100 ms or reload-plus-load exceeds 1000 ms.",
    "Any measured playable-loop step fails or reports zero WebGL nonblank pixels.",
  ],
};

result.measurements.simulation = measureSimulationTicks();

const preview = await startPreviewServer();
let browser;
try {
  browser = await chromium.launch();
  result.environment.browser = {
    engine: "chromium",
    version: browser.version(),
  };
  result.measurements.browser = await measureBrowserPlayableLoop(browser);
} finally {
  if (browser !== undefined) {
    await browser.close();
  }
  preview.kill("SIGTERM");
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);

console.log(`serfbound-performance-baseline-written: ${outputPath}`);
console.log(
  `serfbound-performance-summary: tickAvg=${result.measurements.simulation.averageMs.toFixed(6)}ms frameP95=${result.measurements.browser.frameCadence.p95Ms.toFixed(3)}ms import=${result.measurements.browser.timings.importMs.toFixed(3)}ms save=${result.measurements.browser.timings.saveMs.toFixed(3)}ms reloadLoad=${result.measurements.browser.timings.reloadAndLoadMs.toFixed(3)}ms`,
);

async function collectNodeEnvironment() {
  const osRelease = await readCommand("uname", ["-a"]);
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    osRelease: osRelease.trim(),
  };
}

function measureSimulationTicks() {
  const iterations = 50_000;
  const state = new SerfboundGameState();
  state.advanceTicks(100);

  const startedAt = performance.now();
  state.advanceTicks(iterations);
  const elapsedMs = performance.now() - startedAt;

  return {
    iterations,
    elapsedMs,
    averageMs: elapsedMs / iterations,
    finalTick: state.tick,
    finalGameTime: state.gameTime,
    finalConstTick: state.constTick,
  };
}

async function startPreviewServer() {
  const child = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "preview", "--", "--port", String(port)],
    {
      cwd: workspaceRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Preview server exited early:\n${output}`);
    }

    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        return child;
      }
    } catch {
      await delay(250);
    }
  }

  child.kill("SIGTERM");
  throw new Error(`Preview server did not become ready:\n${output}`);
}

async function measureBrowserPlayableLoop(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const timings = {};

  await page.goto(baseURL);
  const importedData = await importData(page);
  timings.importMs = importedData.elapsedMs;

  timings.startGameMs = await timeAction(page, async () => {
    await page.getByTestId("start-game-button").click();
    await page.waitForFunction(() => document.querySelector("[data-testid='game-state']")?.textContent === "Running");
  });

  timings.buildFlagMs = await timeAction(page, async () => {
    await clickCanvasFraction(page, 0.5, 0.5);
    await page.waitForFunction(() => document.querySelector("[data-testid='command-state']")?.textContent === "Build flag available");
    await page.getByTestId("build-flag-button").click();
    await page.waitForFunction(() => document.querySelector("[data-testid='command-state']")?.textContent === "Flag built");
  });

  timings.saveMs = await timeAction(page, async () => {
    await page.getByTestId("save-game-button").click();
    await page.waitForFunction(() => document.querySelector("[data-testid='save-state']")?.textContent === "Game saved");
  });

  timings.reloadAndLoadMs = await timeAction(page, async () => {
    await page.reload();
    await page.waitForFunction(() => document.querySelector("[data-testid='data-state']")?.textContent === "Data imported");
    await page.waitForFunction(() => document.querySelector("[data-testid='save-state']")?.textContent === "Saved game");
    await page.getByTestId("load-game-button").click();
    await page.waitForFunction(() => document.querySelector("[data-testid='save-state']")?.textContent === "Game loaded");
  });

  const [frameCadence, nonBlankPixels, appState, userAgent] = await Promise.all([
    measureFrameCadence(page),
    countWebglNonBlankPixels(page),
    page.locator("#app").evaluate((element) => ({ ...element.dataset })),
    page.evaluate(() => navigator.userAgent),
  ]);
  await context.close();

  return {
    metadata: {
      viewport: page.viewportSize(),
      userAgent,
      asset: importedData.asset,
    },
    timings,
    frameCadence,
    nonBlankPixels,
    appState: {
      runtime: appState.serfboundRuntime,
      renderer: appState.serfboundRenderer,
      sceneSource: appState.serfboundSceneSource,
      gameState: appState.serfboundGameState,
      localSaveState: appState.serfboundLocalSaveState,
      builtStructureCount: appState.serfboundBuiltStructureCount,
      primitiveCount: appState.serfboundPrimitiveCount,
    },
  };
}

async function importData(page) {
  const asset = await resolveAssetInput();
  const elapsedMs = await timeAction(page, async () => {
    await page.getByTestId("data-import-input").setInputFiles(asset.input);
    await page.waitForFunction(() => document.querySelector("[data-testid='data-state']")?.textContent === "Data imported");
  });

  return {
    asset: asset.metadata,
    elapsedMs,
  };
}

async function resolveAssetInput() {
  if (localSpauPath !== undefined && localSpauPath.trim() !== "" && existsSync(localSpauPath)) {
    const bytes = await readFile(localSpauPath);
    return {
      input: localSpauPath,
      metadata: {
        source: "local-spau-pa",
        path: resolve(localSpauPath),
        byteLength: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    };
  }

  const bytes = Buffer.alloc(32);
  bytes.writeUInt32LE(bytes.length, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(4, 8);
  bytes.writeUInt32LE(24, 12);
  bytes.writeUInt32LE(4, 16);
  bytes.writeUInt32LE(28, 20);

  return {
    input: {
      name: "SPAU.PA",
      mimeType: "application/octet-stream",
      buffer: bytes,
    },
    metadata: {
      source: "generated-ci-safe-pa",
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    },
  };
}

async function clickCanvasFraction(page, fractionX, fractionY) {
  const box = await page.getByTestId("terrain-preview").boundingBox();
  if (box === null) {
    throw new Error("terrain preview canvas is missing");
  }
  await page.mouse.click(box.x + box.width * fractionX, box.y + box.height * fractionY);
}

async function measureFrameCadence(page) {
  return page.evaluate(async () => {
    const samples = [];
    let previous = await new Promise((resolve) => requestAnimationFrame(resolve));
    for (let index = 0; index < 120; index += 1) {
      const current = await new Promise((resolve) => requestAnimationFrame(resolve));
      samples.push(current - previous);
      previous = current;
    }
    const sorted = samples.toSorted((left, right) => left - right);
    const sum = samples.reduce((total, sample) => total + sample, 0);
    const percentile = (value) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))] ?? 0;
    return {
      samples: samples.length,
      averageMs: sum / samples.length,
      p95Ms: percentile(0.95),
      maxMs: sorted.at(-1) ?? 0,
    };
  });
}

async function countWebglNonBlankPixels(page) {
  return page.getByTestId("terrain-preview").evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return 0;
    }

    const context = canvas.getContext("webgl2");
    if (context === null) {
      return 0;
    }

    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    context.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      context.RGBA,
      context.UNSIGNED_BYTE,
      pixels,
    );
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;
      if (red > 40 || green > 40 || blue > 40) {
        count += 1;
      }
    }

    return count;
  });
}

async function timeAction(page, action) {
  void page;
  const startedAt = performance.now();
  await action();
  return performance.now() - startedAt;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function readCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: repoRoot });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", () => {
      resolve(output);
    });
  });
}
