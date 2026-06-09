import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const screenshotPath =
  "../pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png";
const renderSceneScreenshotPath =
  "../pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-03-render-layer-scene-desktop.png";

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

  const nonBlankPixels = await page
    .getByTestId("terrain-preview")
    .evaluate((canvas) => {
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

  expect(nonBlankPixels).toBeGreaterThan(80_000);
});
