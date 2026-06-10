import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const decodedSceneScreenshotPath =
  "../pm/roadmap/serfbound/phase-10-authentic-asset-rendering/artifacts/story-03-decoded-scene-generated-desktop.png";

test("importing a decodable archive renders the decoded sprite scene", async ({ page }) => {
  test.setTimeout(300_000);
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

  // The authentic start screen fronts the game: the seed randomizes, the
  // supplies cycle, and START begins the seeded custom game.
  const canvas = page.getByTestId("terrain-preview");
  const setupBox = await canvas.boundingBox();
  if (setupBox === null) {
    throw new Error("canvas has no bounding box");
  }

  const initX = Math.max(0, Math.floor((setupBox.width - 288) / 2));
  const initY = Math.max(0, Math.floor((setupBox.height - 256) / 3));
  const seedBefore = await page.locator("#app").getAttribute("data-serfbound-init-seed");
  expect(seedBefore).toMatch(/^[1-8]{16}$/);
  await canvas.click({ position: { x: initX + 144, y: initY + 24 * 2 + 10 }, force: true });
  await expect(page.locator("#app")).not.toHaveAttribute(
    "data-serfbound-init-seed",
    seedBefore as string,
  );
  await canvas.click({ position: { x: initX + 144, y: initY + 56 * 2 + 8 }, force: true });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-init-supplies", "35");
  await canvas.click({ position: { x: initX + 144, y: initY + 100 * 2 + 10 }, force: true });
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

  // The whole settlement founds through the authentic UI from here: the
  // build popup places flags and buildings, the panel road slot routes.
  const canvasBox = await canvas.boundingBox();
  if (canvasBox === null) {
    throw new Error("canvas has no bounding box");
  }

  const panelX = Math.max(0, Math.floor((canvasBox.width - 640) / 2));
  const panelY = Math.max(0, canvasBox.height - 80);
  const buildSlotPos = { x: panelX + 64 * 2 + 32, y: panelY + 4 * 2 + 32 };
  const roadSlotPos = { x: panelX + (64 + 48) * 2 + 32, y: panelY + 4 * 2 + 32 };
  const popupX = Math.max(0, Math.floor((canvasBox.width - 288) / 2));
  const popupY = Math.max(0, Math.floor((canvasBox.height - 320) / 3));
  const flagItemPos = { x: popupX + 72 * 2 + 16, y: popupY + 117 * 2 + 16 };
  const lumberjackItemPos = { x: popupX + 8 * 2 + 24, y: popupY + 67 * 2 + 24 };

  // Build a flag inside the claimed territory through the build popup.
  let flagBuilt = false;
  let flagClick = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 40 && !flagBuilt; attempt += 1) {
    const x = castleClick.x - 60 + (attempt % 8) * 24;
    const y = castleClick.y + 40 + Math.floor(attempt / 8) * 22;
    await canvas.click({ position: { x, y }, force: true });
    await canvas.click({ position: buildSlotPos, force: true });
    await canvas.click({ position: flagItemPos, force: true });
    const flagCount = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-flag-count");
    if (flagCount === "2") {
      flagBuilt = true;
      flagClick = { x, y };
    }
  }
  expect(flagBuilt).toBe(true);

  // Connect the castle flag to the new flag with the panel's road slot.
  let roadBuilt = false;
  for (let fromAttempt = 0; fromAttempt < 9 && !roadBuilt; fromAttempt += 1) {
    const fromX = castleClick.x + 16 + ((fromAttempt % 3) - 1) * 12;
    const fromY = castleClick.y + 10 + (Math.floor(fromAttempt / 3) - 1) * 10;
    await canvas.click({ position: roadSlotPos, force: true });
    await canvas.click({ position: { x: fromX, y: fromY }, force: true });
    await canvas.click({ position: { x: flagClick.x, y: flagClick.y }, force: true });
    const effect = await page.locator("#app").getAttribute("data-serfbound-last-effect");
    roadBuilt = effect === "road-built";
    if (!roadBuilt && (await page.locator("#app").getAttribute("data-serfbound-road-mode")) !== "idle") {
      await canvas.click({ position: roadSlotPos, force: true });
    }
  }
  expect(roadBuilt).toBe(true);

  // Build a lumberjack through the build popup.
  let lumberjackBuilt = false;
  let lumberjackClick = { x: 0, y: 0 };
  for (let attempt = 0; attempt < 60 && !lumberjackBuilt; attempt += 1) {
    const x = castleClick.x - 90 + (attempt % 10) * 22;
    const y = castleClick.y + 80 + Math.floor(attempt / 10) * 24;
    await canvas.click({ position: { x, y }, force: true });
    await canvas.click({ position: buildSlotPos, force: true });
    await canvas.click({ position: lumberjackItemPos, force: true });
    const effect = await page.locator("#app").getAttribute("data-serfbound-last-effect");
    if (effect === "building-built") {
      lumberjackBuilt = true;
      lumberjackClick = { x, y };
    }
  }
  expect(lumberjackBuilt).toBe(true);
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-building-count",
    "2",
  );

  // Live economy stats are exposed before construction logistics start.
  const stockBeforeConstruction = await page
    .locator("#app")
    .getAttribute("data-serfbound-stock-summary");
  expect(stockBeforeConstruction).toMatch(
    /^plank:\d+,stone:\d+,lumber:\d+,bread:\d+,steel:\d+$/,
  );

  // Military stats ride the same sync: the castle recruits knights from its
  // preset weapons, so the knight stock and morale are live nonzero values.
  const militarySummary = await page
    .locator("#app")
    .getAttribute("data-serfbound-military-summary");
  expect(militarySummary).toMatch(/^sword:\d+,shield:\d+,knight:[1-9]\d*,morale:\d+$/);

  // The authentic panel bar renders and drives road mode: clicking the
  // road slot toggles it on and off (reference button behavior).
  const panelButtons = await page
    .locator("#app")
    .getAttribute("data-serfbound-panel-buttons");
  expect(panelButtons).toMatch(/^\d+,8,10,12,14$/);
  const roadSlot = roadSlotPos;
  await canvas.click({ position: roadSlot, force: true });
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-road-mode",
    "awaiting-start",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-panel-buttons",
    /^\d+,25,10,12,14$/,
  );
  await canvas.click({ position: roadSlot, force: true });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-road-mode", "idle");

  // The popup system: the stats slot opens the resources box, a click
  // outside closes it, and the build slot opens the build menu.
  const statsSlot = { x: panelX + (64 + 3 * 48) * 2 + 32, y: panelY + 4 * 2 + 32 };
  await canvas.click({ position: statsSlot, force: true });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-popup", "stats");
  await canvas.click({ position: { x: 30, y: 300 }, force: true });
  await expect(page.locator("#app")).not.toHaveAttribute("data-serfbound-popup", /.+/);
  const buildSlot = { x: panelX + 64 * 2 + 32, y: panelY + 4 * 2 + 32 };
  await canvas.click({ position: buildSlot, force: true });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-popup", "buildBasic");
  await canvas.click({ position: { x: 30, y: 300 }, force: true });
  await expect(page.locator("#app")).not.toHaveAttribute("data-serfbound-popup", /.+/);

  // The minimap: the map slot opens it and clicking inside navigates the
  // viewport (the scroll position jumps to the clicked tile).
  const mapSlot = { x: panelX + (64 + 2 * 48) * 2 + 32, y: panelY + 4 * 2 + 32 };
  await canvas.click({ position: mapSlot, force: true });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-popup", "map");
  await canvas.click({
    position: { x: popupX + 16 + 200, y: popupY + 32 + 200 },
    force: true,
  });
  await expect(page.locator("#app")).not.toHaveAttribute("data-serfbound-scroll", "0,0");
  // Navigate back to the origin so later scroll assertions stay valid.
  await canvas.click({ position: { x: popupX + 16 + 1, y: popupY + 32 + 1 }, force: true });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-scroll", "0,0");
  await canvas.click({ position: { x: 30, y: canvasBox.height - 200 }, force: true });
  await expect(page.locator("#app")).not.toHaveAttribute("data-serfbound-popup", /.+/);

  // Connect the lumberjack's flag so builders and materials can reach it;
  // construction is serf-driven and completes only over a connected road.
  let lumberjackRoadBuilt = false;
  for (let attempt = 0; attempt < 81 && !lumberjackRoadBuilt; attempt += 1) {
    const fromJitter = attempt % 9;
    const toJitter = Math.floor(attempt / 9);
    const fromX = castleClick.x + 16 + ((fromJitter % 3) - 1) * 14;
    const fromY = castleClick.y + 10 + (Math.floor(fromJitter / 3) - 1) * 10;
    const toX = lumberjackClick.x + 16 + ((toJitter % 3) - 1) * 14;
    const toY = lumberjackClick.y + 10 + (Math.floor(toJitter / 3) - 1) * 10;
    await page.getByTestId("build-road-button").click();
    await canvas.click({ position: { x: fromX, y: fromY }, force: true });
    await canvas.click({ position: { x: toX, y: toY }, force: true });
    const effect = await page.locator("#app").getAttribute("data-serfbound-last-effect");
    lumberjackRoadBuilt = effect === "road-built";
  }
  expect(lumberjackRoadBuilt).toBe(true);

  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-building-done-count",
    "2",
    { timeout: 150_000 },
  );

  // The completed building surfaced a notification in the game font.
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-notification",
    "BUILDING COMPLETE",
  );

  // Audio: the first canvas gesture unlocked WebAudio and the event
  // mapping has fired clips (the build commands clicked in).
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-audio", "unlocked");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-last-sfx", /^\d+$/);

  // The stats updated live: construction logistics drew planks from the
  // castle stock while the settlement built itself.
  const stockAfterConstruction = await page
    .locator("#app")
    .getAttribute("data-serfbound-stock-summary");
  expect(stockAfterConstruction).toMatch(
    /^plank:\d+,stone:\d+,lumber:\d+,bread:\d+,steel:\d+$/,
  );
  expect(stockAfterConstruction).not.toBe(stockBeforeConstruction);

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
