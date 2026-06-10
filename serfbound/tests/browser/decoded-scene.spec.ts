import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const decodedSceneScreenshotPath =
  "../pm/roadmap/serfbound/phase-10-authentic-asset-rendering/artifacts/story-03-decoded-scene-generated-desktop.png";

test("importing a decodable archive renders the decoded sprite scene", async ({ page }) => {
  await mkdir(dirname(decodedSceneScreenshotPath), { recursive: true });
  await page.goto("/");

  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "generated-fixture",
  );

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });

  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "dos-pa-decoded",
  );
  await expect(page.getByTestId("scene-state")).toHaveText("Imported terrain");
  await expect(page.getByTestId("scene-detail")).toContainText("Authentic terrain decoded");

  const spriteCount = Number(
    await page.locator("#app").getAttribute("data-serfbound-sprite-count"),
  );
  expect(spriteCount).toBeGreaterThan(1000);

  // The decoded scene survives the IndexedDB restore path.
  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "dos-pa-decoded",
  );

  // Starting a game switches to the generated-landscape scene.
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-mode",
    "landscape",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-scroll", "0,0");

  await page.getByTestId("terrain-preview").click({ position: { x: 480, y: 270 } });
  await page.getByTestId("build-flag-button").click();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-built-structure-count",
    "1",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "dos-pa-decoded",
  );

  // Arrow keys scroll the landscape by whole tiles and wrap at map edges.
  await page.locator("#app").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-scroll", "1,1");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-scroll", "63,1");

  await page.screenshot({ fullPage: true, path: decodedSceneScreenshotPath });
});
