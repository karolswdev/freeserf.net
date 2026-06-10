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

  // Starting a game switches to the generated-landscape scene and asks for
  // the founding castle.
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-mode",
    "landscape",
  );
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-scroll", "0,0");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-has-castle",
    "false",
  );
  await expect(page.getByTestId("command-state")).toHaveText("Place your castle");

  // Click around until a valid castle site accepts (terrain-dependent).
  const canvas = page.getByTestId("terrain-preview");
  let castleClick = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = 120 + (attempt % 6) * 140;
    const y = 100 + Math.floor(attempt / 6) * 90;
    await canvas.click({ position: { x, y } });
    const hasCastle = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-has-castle");
    if (hasCastle === "true") {
      castleClick = { x, y };
      break;
    }
  }
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-has-castle",
    "true",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-flag-count",
    "1",
  );

  // Build a flag inside the claimed territory, near the castle.
  let flagBuilt = false;
  let flagClick = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 40 && !flagBuilt; attempt += 1) {
    const x = castleClick.x - 60 + (attempt % 8) * 24;
    const y = castleClick.y + 40 + Math.floor(attempt / 8) * 22;
    await canvas.click({ position: { x, y } });
    await page.getByTestId("build-flag-button").click();
    const flagCount = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-flag-count");
    if (flagCount === "2") {
      flagBuilt = true;
      flagClick = { x, y };
    }
  }
  expect(flagBuilt).toBe(true);

  // Connect the castle flag to the new flag in road mode (the castle's flag
  // stands down-right of the castle; jitter to land on the exact tiles).
  await expect(page.getByTestId("build-road-button")).toBeEnabled();
  let roadBuilt = false;
  for (let fromAttempt = 0; fromAttempt < 9 && !roadBuilt; fromAttempt += 1) {
    const fromX = castleClick.x + 16 + ((fromAttempt % 3) - 1) * 12;
    const fromY = castleClick.y + 10 + (Math.floor(fromAttempt / 3) - 1) * 10;
    await page.getByTestId("build-road-button").click();
    await canvas.click({ position: { x: fromX, y: fromY } });
    await canvas.click({ position: { x: flagClick.x, y: flagClick.y } });
    const effect = await page.locator("#app").getAttribute("data-serfbound-last-effect");
    roadBuilt = effect === "road-built";
  }
  expect(roadBuilt).toBe(true);

  // Build a lumberjack inside territory and let it finish on the game clock.
  await expect(page.getByTestId("build-lumberjack-button")).toBeEnabled();
  let lumberjackBuilt = false;
  for (let attempt = 0; attempt < 60 && !lumberjackBuilt; attempt += 1) {
    const x = castleClick.x - 90 + (attempt % 10) * 22;
    const y = castleClick.y + 80 + Math.floor(attempt / 10) * 24;
    await canvas.click({ position: { x, y } });
    await page.getByTestId("build-lumberjack-button").click();
    const effect = await page.locator("#app").getAttribute("data-serfbound-last-effect");
    lumberjackBuilt = effect === "building-built";
  }
  expect(lumberjackBuilt).toBe(true);
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-building-count",
    "2",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-building-done-count",
    "2",
    { timeout: 15_000 },
  );

  // The founded settlement survives save -> reload -> load.
  await page.getByTestId("save-game-button").click();
  await expect(page.getByTestId("save-state")).toHaveText("Game saved");
  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await page.getByTestId("load-game-button").click();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-has-castle",
    "true",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-flag-count",
    "3",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-building-count",
    "2",
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
