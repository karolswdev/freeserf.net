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
  await page.goto("/");

  const shell = page.getByTestId("serfbound-shell");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("heading", { name: "Serfbound" })).toBeVisible();
  await expect(page.getByTestId("runtime-pill")).toHaveText("Browser runtime");
  await expect(page.getByTestId("data-state")).toHaveText("No game data imported");
  await expect(page.getByTestId("scene-state")).toHaveText("Generated layers");
  await expect(page.getByTestId("scene-detail")).toHaveText(
    "WebGL2, generated fixture assets",
  );
  await expect(page.getByTestId("data-reset-button")).toBeDisabled();

  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-runtime",
    "browser",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "missing",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-renderer", "webgl2");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "generated-fixture",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-layer-count", "5");

  await page.screenshot({ fullPage: true, path: screenshotPath });
  await page.screenshot({ fullPage: true, path: renderSceneScreenshotPath });

  await page.getByTestId("data-import-input").setInputFiles({
    name: "README.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a supported archive"),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Unsupported data file");
  await expect(page.getByTestId("data-detail")).toHaveText("README.txt is not accepted");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "unsupported",
  );

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: createGeneratedPaArchive(),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Catalog parsed");
  await expect(page.getByTestId("data-detail")).toHaveText(
    "2 entries, 2 defined, 0 fixups, persisted locally",
  );
  await expect(page.getByTestId("source-state")).toHaveText("Local file");
  await expect(page.getByTestId("scene-state")).toHaveText("Catalog layers");
  await expect(page.getByTestId("scene-detail")).toHaveText(
    "WebGL2, 2 defined archive entries",
  );
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
    "data-serfbound-scene-source",
    "dos-pa-catalog",
  );

  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("Catalog parsed");
  await expect(page.getByTestId("data-detail")).toHaveText(
    "Restored SPAU.PA: 2 entries, 2 defined",
  );
  await expect(page.getByTestId("source-state")).toHaveText("Local storage");
  await expect(page.getByTestId("scene-state")).toHaveText("Catalog layers");
  await expect(page.getByTestId("data-reset-button")).toBeEnabled();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "persisted",
  );

  await page.getByTestId("data-reset-button").click();
  await expect(page.getByTestId("data-state")).toHaveText("No game data imported");
  await expect(page.getByTestId("data-detail")).toHaveText(
    "Local data cleared. Select SPAU.PA from your local files.",
  );
  await expect(page.getByTestId("data-reset-button")).toBeDisabled();
  await expect(page.getByTestId("scene-state")).toHaveText("Generated layers");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "cleared",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "generated-fixture",
  );

  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("No game data imported");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-storage-state",
    "empty",
  );

  const nonBlankPixels = await countWebglNonBlankPixels(page);

  expect(nonBlankPixels).toBeGreaterThan(80_000);
});

test("render layer scene stays framed on desktop and mobile viewports", async ({
  page,
}) => {
  await mkdir(dirname(framingDesktopScreenshotPath), { recursive: true });

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
      minimumNonBlankPixels: 18_000,
    },
  ] as const) {
    await page.setViewportSize(viewport.size);
    await page.goto("/");
    await expect(page.getByTestId("scene-state")).toHaveText("Generated layers");
    await expect(page.locator("#app")).toHaveAttribute("data-serfbound-renderer", "webgl2");
    await waitForCanvasResize(page);
    await assertSceneLayoutIsFramed(page, viewport.name);
    expect(await countWebglNonBlankPixels(page)).toBeGreaterThan(
      viewport.minimumNonBlankPixels,
    );
    await page.screenshot({ fullPage: true, path: viewport.screenshotPath });
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
