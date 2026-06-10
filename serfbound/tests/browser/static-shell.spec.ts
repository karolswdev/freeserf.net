import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const screenshotPath =
  "../pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png";
const renderSceneScreenshotPath =
  "../pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-03-render-layer-scene-desktop.png";
const framingDesktopScreenshotPath =
  "../pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-04-framing-desktop.png";
const framingMobileScreenshotPath =
  "../pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-04-framing-mobile.png";
const basicPanelsDesktopScreenshotPath =
  "../pm/roadmap/serfbound/phase-6-ui-input-shell/artifacts/story-03-basic-panels-desktop.png";
const basicPanelsMobileScreenshotPath =
  "../pm/roadmap/serfbound/phase-6-ui-input-shell/artifacts/story-03-basic-panels-mobile.png";
const localGameStartedScreenshotPath =
  "../pm/roadmap/serfbound/phase-7-playable-slice/artifacts/story-01-local-game-started-desktop.png";

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

test("static app shell renders without original data or a desktop companion", async ({
  page,
}) => {
  await mkdir(dirname(screenshotPath), { recursive: true });
  await mkdir(dirname(renderSceneScreenshotPath), { recursive: true });
  await mkdir(dirname(basicPanelsDesktopScreenshotPath), { recursive: true });
  await mkdir(dirname(localGameStartedScreenshotPath), { recursive: true });
  await page.goto("/");

  const shell = page.getByTestId("serfbound-shell");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("heading", { name: "Serfbound" })).toBeVisible();
  await expect(page.getByTestId("runtime-pill")).toHaveText("Ready");
  await expect(page.getByTestId("data-state")).toHaveText("No game data");
  await expect(page.getByTestId("game-state")).toHaveText("Data needed");
  await expect(page.getByTestId("game-detail")).toHaveText(
    "Import game data first.",
  );
  await expect(page.getByTestId("start-game-button")).toBeDisabled();
  await expect(page.getByTestId("scene-state")).toHaveText("Preview terrain");
  await expect(page.getByTestId("scene-detail")).toHaveText("Select land to inspect it.");
  await expect(page.getByTestId("selected-tile-state")).toHaveText("No tile selected");
  await expect(page.getByTestId("command-state")).toHaveText("No action selected");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-command-state", "idle");
  await expect(shell).not.toContainText("@serfbound/engine");
  await expect(shell).not.toContainText("WebGL");
  await expect(shell).not.toContainText("debug.inspect-map-tile");
  await expect(page.getByTestId("data-reset-button")).toBeDisabled();

  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-runtime",
    "browser",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "missing",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-game-state", "setup");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-start-mode", "import-required");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-local-game-state", "none");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-renderer", "webgl2");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "generated-fixture",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-layer-count", "5");

  await page.screenshot({ fullPage: true, path: screenshotPath });
  await page.screenshot({ fullPage: true, path: renderSceneScreenshotPath });
  await page.screenshot({ fullPage: true, path: basicPanelsDesktopScreenshotPath });

  await page.getByTestId("data-import-input").setInputFiles({
    name: "README.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a supported archive"),
  });
  await expect(page.getByTestId("data-state")).toHaveText("File not usable");
  await expect(page.getByTestId("data-detail")).toHaveText(
    "README.txt cannot be used. Choose SPAU.PA to start.",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "unsupported",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-recoverable-state",
    "file-error",
  );
  await expect(page.getByTestId("start-game-button")).toBeDisabled();

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: createGeneratedPaArchive(),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.getByTestId("data-detail")).toHaveText("2 resources loaded and saved.");
  await expect(page.getByTestId("game-state")).toHaveText("Ready");
  await expect(page.getByTestId("game-detail")).toHaveText(
    "Imported data is ready. Start when prepared.",
  );
  await expect(page.getByTestId("source-state")).toHaveText("Imported data");
  await expect(page.getByTestId("scene-state")).toHaveText("Imported terrain");
  await expect(page.getByTestId("scene-detail")).toHaveText("2 resources are ready for play.");
  await expect(page.getByTestId("data-reset-button")).toBeEnabled();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "supported",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-catalog-state",
    "parsed",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "persisted",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-recoverable-state",
    "none",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-game-state", "ready");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-start-mode",
    "imported-data",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "dos-pa-catalog",
  );

  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.getByTestId("data-detail")).toHaveText("SPAU.PA restored with 2 resources.");
  await expect(page.getByTestId("source-state")).toHaveText("Imported data");
  await expect(page.getByTestId("scene-state")).toHaveText("Imported terrain");
  await expect(page.getByTestId("game-state")).toHaveText("Ready");
  await expect(page.getByTestId("start-game-button")).toBeEnabled();
  await expect(page.getByTestId("data-reset-button")).toBeEnabled();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "persisted",
  );
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running");
  await expect(page.getByTestId("game-detail")).toHaveText(
    "Local game started: map 64x64.",
  );
  await expect(page.getByTestId("scene-state")).toHaveText("Settlement map");
  await expect(page.getByTestId("scene-detail")).toHaveText(
    "2 resources initialized with seed 3128716831287168.",
  );
  await expect(page.getByTestId("start-game-button")).toBeDisabled();
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-game-state", "running");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-start-mode",
    "imported-data",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-local-game-state",
    "running",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-local-game-mode",
    "local-single-player",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-local-game-seed",
    "3128716831287168",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-local-game-map-size", "3");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-local-game-map-tiles",
    "4096",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-local-game-data-entries",
    "2",
  );
  await page.screenshot({ fullPage: true, path: localGameStartedScreenshotPath });

  await page.getByTestId("data-reset-button").click();
  await expect(page.getByTestId("data-state")).toHaveText("No game data");
  await expect(page.getByTestId("data-detail")).toHaveText(
    "Saved data cleared. Import SPAU.PA to start.",
  );
  await expect(page.getByTestId("game-state")).toHaveText("Data needed");
  await expect(page.getByTestId("start-game-button")).toBeDisabled();
  await expect(page.getByTestId("data-reset-button")).toBeDisabled();
  await expect(page.getByTestId("scene-state")).toHaveText("Preview terrain");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "cleared",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "generated-fixture",
  );

  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("No game data");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "empty",
  );
  await movePointerToCanvasFraction(page, 0.5, 0.5);
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-state", "hover");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-type", "mouse");
  await expect(page.getByTestId("pointer-state")).toContainText(/Hover \d+,\d+/);
  await expect(page.getByTestId("pointer-detail")).toContainText(/Map \d+,\d+ via mouse/);
  await clickCanvasFraction(page, 0.5, 0.5);
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-state", "selected");
  await expect(page.getByTestId("pointer-state")).toContainText(/Selected \d+,\d+/);
  await expect(page.getByTestId("selected-tile-state")).toContainText(/Tile \d+,\d+/);
  await expect(page.getByTestId("selected-tile-detail")).toContainText(
    /Position \d+ - map \d+,\d+/,
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-command-state", "accepted");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-command-type",
    "debug.inspect-map-tile",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-command-id", "1");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-command-log-length",
    "1",
  );
  await expect(page.getByTestId("command-state")).toHaveText("Inspect land");
  await expect(page.getByTestId("command-detail")).toContainText(/Tile \d+,\d+ is selected/);
  await expect(shell).not.toContainText("debug.inspect-map-tile");
  await dispatchCanvasPointer(page, "pointermove", 0.25, 0.35, "touch");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-type", "touch");
  await expect(page.getByTestId("pointer-detail")).toContainText(/via touch/);

  const nonBlankPixels = await countWebglNonBlankPixels(page);

  expect(nonBlankPixels).toBeGreaterThan(80_000);
});

test("render layer scene stays framed on desktop and mobile viewports", async ({
  page,
}) => {
  await mkdir(dirname(framingDesktopScreenshotPath), { recursive: true });
  await mkdir(dirname(basicPanelsMobileScreenshotPath), { recursive: true });

  for (const viewport of [
    {
      name: "desktop",
      size: { width: 1280, height: 720 },
      screenshotPath: framingDesktopScreenshotPath,
      minimumNonBlankPixels: 80_000,
    },
    {
      name: "mobile",
      size: { width: 390, height: 844 },
      screenshotPath: framingMobileScreenshotPath,
      panelScreenshotPath: basicPanelsMobileScreenshotPath,
      minimumNonBlankPixels: 18_000,
    },
  ] as const) {
    await page.setViewportSize(viewport.size);
    await page.goto("/");
    await expect(page.getByTestId("scene-state")).toHaveText("Preview terrain");
    await expect(page.locator("#app")).toHaveAttribute("data-serfbound-renderer", "webgl2");
    await waitForCanvasResize(page);
    await assertSceneLayoutIsFramed(page, viewport.name);
    expect(await countWebglNonBlankPixels(page)).toBeGreaterThan(
      viewport.minimumNonBlankPixels,
    );
    await page.screenshot({ fullPage: true, path: viewport.screenshotPath });
    if ("panelScreenshotPath" in viewport) {
      await page.screenshot({ fullPage: true, path: viewport.panelScreenshotPath });
    }
  }
});

async function waitForCanvasResize(page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector("[data-testid='terrain-preview']");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return false;
    }

    const rect = canvas.getBoundingClientRect();
    return (
      canvas.width === Math.max(1, Math.round(rect.width)) &&
      canvas.height === Math.max(1, Math.round(rect.height))
    );
  });
}

async function movePointerToCanvasFraction(page, fractionX, fractionY) {
  const box = await page.getByTestId("terrain-preview").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(
    box.x + box.width * fractionX,
    box.y + box.height * fractionY,
  );
}

async function clickCanvasFraction(page, fractionX, fractionY) {
  const box = await page.getByTestId("terrain-preview").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    box.x + box.width * fractionX,
    box.y + box.height * fractionY,
  );
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
          pointerId: 11,
          pointerType: eventInit.pointerType,
        }),
      );
    },
    { fractionX, fractionY, pointerType, type },
  );
}

async function assertSceneLayoutIsFramed(page, viewportName) {
  const layout = await page.evaluate(() => {
    const scene = document.querySelector(".scene");
    const statusPanel = document.querySelector(".status-panel");
    const canvas = document.querySelector("[data-testid='terrain-preview']");
    if (
      !(scene instanceof HTMLElement) ||
      !(statusPanel instanceof HTMLElement) ||
      !(canvas instanceof HTMLCanvasElement)
    ) {
      throw new Error("Serfbound framing elements are missing.");
    }

    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };
    const canvasRect = rectOf(canvas);

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scene: rectOf(scene),
      statusPanel: rectOf(statusPanel),
      canvas: {
        ...canvasRect,
        backingWidth: canvas.width,
        backingHeight: canvas.height,
      },
    };
  });

  expect(layout.canvas.width, `${viewportName} canvas width`).toBeGreaterThan(280);
  expect(layout.canvas.height, `${viewportName} canvas height`).toBeGreaterThan(260);
  expect(
    Math.abs(layout.canvas.backingWidth - Math.round(layout.canvas.width)),
    `${viewportName} canvas backing width`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(layout.canvas.backingHeight - Math.round(layout.canvas.height)),
    `${viewportName} canvas backing height`,
  ).toBeLessThanOrEqual(1);
  expect(layout.canvas.left, `${viewportName} canvas left`).toBeGreaterThanOrEqual(0);
  expect(layout.canvas.right, `${viewportName} canvas right`).toBeLessThanOrEqual(
    layout.viewport.width + 1,
  );
  expect(layout.canvas.top, `${viewportName} canvas top`).toBeGreaterThanOrEqual(0);

  if (layout.viewport.width <= 760) {
    expect(
      layout.statusPanel.top,
      `${viewportName} status panel stacks below scene`,
    ).toBeGreaterThanOrEqual(layout.scene.bottom - 1);
  } else {
    expect(
      layout.statusPanel.left,
      `${viewportName} status panel sits beside scene`,
    ).toBeGreaterThanOrEqual(layout.scene.right - 1);
  }
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
