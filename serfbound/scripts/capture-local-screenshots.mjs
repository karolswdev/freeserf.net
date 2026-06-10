// Opt-in, real-data screenshot capture for phase evidence. Requires the
// static build (npm run build:web) plus the user's local SPAU.PA. Never runs
// in CI; the original data file itself is never copied anywhere.

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename, resolve } from "node:path";

import { chromium } from "@playwright/test";

const enabled = process.env["SERFBOUND_RUN_LOCAL_ASSET_TESTS"] === "1";
const configuredPath = process.env["SERFBOUND_SPAU_PA"];
const previewPort = 4189;
const previewUrl = `http://127.0.0.1:${previewPort}/`;
// Captures default to an uncommitted scratch directory; evidence captures pass
// the phase artifacts folder explicitly via SERFBOUND_CAPTURE_DIR.
const artifactsDir = process.env["SERFBOUND_CAPTURE_DIR"] ?? "../.tmp/browser-screenshots";
const namePrefix = process.env["SERFBOUND_CAPTURE_PREFIX"] ?? "capture";
// SB-21-03: capture at a high-DPI scale factor to prove native-resolution
// rendering (defaults to 1, today's baseline).
const deviceScaleFactor = Math.max(1, Number(process.env["SERFBOUND_CAPTURE_DPR"] ?? "1") || 1);

if (!enabled || configuredPath === undefined || configuredPath.trim() === "") {
  console.log(
    "serfbound-local-screenshots-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 and SERFBOUND_SPAU_PA to capture.",
  );
  process.exit(0);
}

if (basename(configuredPath).toLowerCase() !== "spau.pa" || !existsSync(configuredPath)) {
  console.error(`serfbound-local-screenshots-failed: local SPAU.PA not found at ${configuredPath}.`);
  process.exit(1);
}

if (!existsSync("dist/index.html")) {
  console.error("serfbound-local-screenshots-failed: run npm run build:web first.");
  process.exit(1);
}

const preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(previewPort)], {
  stdio: "ignore",
});

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(previewUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }

    await new Promise((resolvePoll) => setTimeout(resolvePoll, 500));
  }

  throw new Error(`preview server did not start at ${previewUrl}`);
}

let exitCode = 0;
try {
  await waitForPreview();
  await mkdir(artifactsDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor,
  });
  await page.goto(previewUrl);

  await page.getByTestId("data-import-input").setInputFiles(resolve(configuredPath));
  await page
    .locator("#app[data-serfbound-scene-source='dos-pa-decoded']")
    .waitFor({ timeout: 15_000 });

  const terrainShot = `${artifactsDir}/${namePrefix}-import-preview-desktop.png`;
  await page.screenshot({ fullPage: true, path: terrainShot });
  const canvasShot = `${artifactsDir}/${namePrefix}-import-preview-canvas.png`;
  await page.getByTestId("terrain-preview").screenshot({ path: canvasShot });

  await page.getByTestId("start-game-button").click();
  await page.locator("#app[data-serfbound-game-state='running']").waitFor();

  // Found the castle: click around until a valid site accepts.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const x = 100 + (attempt % 8) * 130;
    const y = 90 + Math.floor(attempt / 8) * 100;
    await page.getByTestId("terrain-preview").click({ position: { x, y } });
    const hasCastle = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-has-castle");
    if (hasCastle === "true") {
      break;
    }
  }
  await page.locator("#app[data-serfbound-world-has-castle='true']").waitFor({ timeout: 5_000 });

  const flagShot = `${artifactsDir}/${namePrefix}-running-game-desktop.png`;
  await page.screenshot({ fullPage: true, path: flagShot });

  const spriteCount = await page.locator("#app").getAttribute("data-serfbound-sprite-count");
  await browser.close();

  console.log(
    `serfbound-local-screenshots-ok: ${spriteCount} decoded sprites on screen; saved ${terrainShot}, ${canvasShot}, ${flagShot}`,
  );
} catch (error) {
  console.error(
    `serfbound-local-screenshots-failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  exitCode = 1;
} finally {
  preview.kill("SIGTERM");
}

process.exit(exitCode);
