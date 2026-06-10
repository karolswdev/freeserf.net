import { expect, test } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const compatibilityReportPath =
  "../pm/roadmap/serfbound/phase-8-browser-hardening/artifacts/story-04-browser-compatibility-report.json";

function createGeneratedPaArchive(): Buffer {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32LE(bytes.length, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(4, 8);
  bytes.writeUInt32LE(24, 12);
  bytes.writeUInt32LE(4, 16);
  bytes.writeUInt32LE(28, 20);
  return bytes;
}

test("browser compatibility smoke covers rendering, import, storage, input, and accessibility", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await resetSerfboundDatabases(page);
  await page.reload();

  const before = await collectBrowserFacts(page);
  expect(before.webgl2).toBe(true);
  expect(before.indexedDb).toBe(true);
  expect(before.fileApi).toBe(true);
  expect(before.pointerEvent).toBe(true);

  await expect(page.getByTestId("serfbound-shell")).toBeVisible();
  await expect(page.getByTestId("runtime-pill")).toHaveText("Ready");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-renderer", "webgl2");

  await page.keyboard.press("Tab");
  await expect(page.getByTestId("data-import-control")).toBeFocused();

  const contrast = await measureContrast(page);
  expect(contrast.minimumRatio).toBeGreaterThanOrEqual(4.5);

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: createGeneratedPaArchive(),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "persisted",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "dos-pa-catalog",
  );

  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running");
  await expect(page.getByTestId("save-game-button")).toBeEnabled();

  await dispatchCanvasPointer(page, "pointermove", 0.45, 0.45, "mouse");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-state", "hover");
  await dispatchCanvasPointer(page, "pointermove", 0.5, 0.5, "touch");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-type", "touch");

  await page.getByTestId("save-game-button").click();
  await expect(page.getByTestId("save-state")).toHaveText("Game saved");
  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.getByTestId("save-state")).toHaveText("Saved game");
  await expect(page.getByTestId("load-game-button")).toBeEnabled();
  await page.getByTestId("load-game-button").click();
  await expect(page.getByTestId("save-state")).toHaveText("Game loaded");

  const nonBlankPixels = await countWebglNonBlankPixels(page);
  expect(nonBlankPixels).toBeGreaterThan(before.mobileViewport ? 18_000 : 80_000);

  const after = await collectBrowserFacts(page);
  await appendCompatibilityResult({
    project: testInfo.project.name,
    browserName: testInfo.project.use.browserName ?? "unknown",
    status: "passed",
    viewport: after.viewport,
    userAgent: after.userAgent,
    platform: after.platform,
    maxTouchPoints: after.maxTouchPoints,
    renderer: "webgl2",
    fileImport: "passed",
    indexedDbStorage: "passed",
    pointerInput: "passed",
    touchPointerInput: "passed",
    keyboardFocus: "passed",
    contrastMinimumRatio: contrast.minimumRatio,
    reducedMotionPreference: after.reducedMotion ? "reduce" : "no-preference",
    nonBlankPixels,
  });
});

async function resetSerfboundDatabases(page) {
  for (const databaseName of [
    "serfbound-imported-data",
    "serfbound-local-game-saves",
  ]) {
    await page.evaluate(async (name) => {
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error ?? new Error(`Could not delete ${name}`));
        request.onblocked = () => reject(new Error(`${name} deletion was blocked`));
      });
    }, databaseName);
  }
}

async function collectBrowserFacts(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      webgl2: canvas.getContext("webgl2") !== null,
      indexedDb: "indexedDB" in window,
      fileApi: "File" in window && "FileReader" in window,
      pointerEvent: "PointerEvent" in window,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      mobileViewport: innerWidth <= 760,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        deviceScaleFactor: devicePixelRatio,
      },
    };
  });
}

async function measureContrast(page) {
  return page.evaluate(() => {
    const selectors = [
      "[data-testid='data-state']",
      "[data-testid='data-detail']",
      "[data-testid='start-game-button']",
      "[data-testid='data-import-control']",
    ];
    const ratios = selectors.map((selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) {
        throw new Error(`${selector} is missing`);
      }

      const style = getComputedStyle(element);
      const parentStyle = getComputedStyle(element.parentElement ?? document.body);
      return contrastRatio(
        parseRgb(style.color).rgb,
        compositeOver(parseRgb(style.backgroundColor), parseRgb(parentStyle.backgroundColor).rgb),
      );
    });

    return {
      minimumRatio: Math.min(...ratios),
      ratios,
    };

    function parseRgb(value: string, fallback = "rgb(20, 24, 22)") {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (match === null || value === "rgba(0, 0, 0, 0)") {
        return parseRgb(fallback);
      }

      const parts = match[1].split(",").map((part) => Number(part.trim()));
      return {
        alpha: Number.isFinite(parts[3]) ? parts[3] : 1,
        rgb: parts.slice(0, 3) as [number, number, number],
      };
    }

    function compositeOver(
      foreground: { readonly alpha: number; readonly rgb: readonly [number, number, number] },
      background: readonly [number, number, number],
    ) {
      return foreground.rgb.map((channel, index) =>
        Math.round(channel * foreground.alpha + background[index] * (1 - foreground.alpha)),
      ) as [number, number, number];
    }

    function luminance([r, g, b]: readonly [number, number, number]) {
      const linear = [r, g, b].map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    }

    function contrastRatio(
      foreground: readonly [number, number, number],
      background: readonly [number, number, number],
    ) {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    }
  });
}

async function dispatchCanvasPointer(page, type, fractionX, fractionY, pointerType) {
  await page.getByTestId("terrain-preview").evaluate(
    (canvas, eventInit) => {
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("terrain preview canvas is missing");
      }

      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(
        new PointerEvent(eventInit.type, {
          bubbles: true,
          clientX: rect.left + rect.width * eventInit.fractionX,
          clientY: rect.top + rect.height * eventInit.fractionY,
          pointerId: 17,
          pointerType: eventInit.pointerType,
        }),
      );
    },
    { fractionX, fractionY, pointerType, type },
  );
}

async function countWebglNonBlankPixels(page) {
  return page.getByTestId("terrain-preview").evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("terrain preview canvas is missing");
    }

    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
    if (gl === null) {
      throw new Error("WebGL2 context is unavailable");
    }

    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let nonBlank = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] !== 0 || pixels[index + 1] !== 0 || pixels[index + 2] !== 0) {
        nonBlank += 1;
      }
    }

    return nonBlank;
  });
}

async function appendCompatibilityResult(result) {
  await mkdir(dirname(compatibilityReportPath), { recursive: true });
  let existing = [];
  try {
    existing = JSON.parse(await readFile(compatibilityReportPath, "utf8"));
  } catch {
    existing = [];
  }

  const next = [
    ...existing.filter((entry) => entry.project !== result.project),
    result,
  ].sort((left, right) => left.project.localeCompare(right.project));
  await writeFile(compatibilityReportPath, `${JSON.stringify(next, null, 2)}\n`);
}
