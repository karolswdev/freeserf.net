import { devices, expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-19-03: the game is genuinely playable on a touch device — the
// authentic UI scales to 1x on narrow canvases and taps drive the init
// screen, the castle founding, and the panel bar.
test.use({
  ...devices["iPhone 13"],
  hasTouch: true,
});

test("a phone founds a settlement through the authentic UI by touch", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no bounding box");
  }

  // Narrow canvas: the chrome drops to 1x, so the init box is 144x128.
  const scale = box.width < 700 ? 1 : 2;
  const initX = Math.max(0, Math.floor((box.width - 144 * scale) / 2));
  const initY = Math.max(0, Math.floor((box.height - 128 * scale) / 3));
  await canvas.tap({ position: { x: initX + 72 * scale, y: initY + 104 * scale + 5 * scale }, force: true });
  await expect(page.getByTestId("game-state")).toHaveText("Running");

  // Found the castle by tapping the map.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = 40 + (attempt % 6) * Math.floor((box.width - 80) / 6);
    const y = 80 + Math.floor(attempt / 6) * 60;
    await canvas.tap({ position: { x, y }, force: true });
    const hasCastle = await page
      .locator("#app")
      .getAttribute("data-serfbound-world-has-castle");
    if (hasCastle === "true") {
      break;
    }
  }
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-world-has-castle",
    "true",
  );

  // Layout can shift once the status panel updates; measure fresh.
  const runningBox = await canvas.boundingBox();
  if (runningBox === null) {
    throw new Error("canvas has no bounding box");
  }

  // The panel bar responds to taps: the road slot toggles road mode.
  const panelX = Math.max(0, Math.floor((runningBox.width - 320 * scale) / 2));
  const panelY = Math.max(0, runningBox.height - 40 * scale);
  await canvas.tap({
    position: {
      x: panelX + (64 + 48) * scale + 16 * scale,
      y: panelY + 4 * scale + 16 * scale,
    },
    force: true,
  });
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-road-mode",
    "awaiting-start",
  );

  // The stats popup opens and closes by touch.
  await canvas.tap({
    position: {
      x: panelX + (64 + 48) * scale + 16 * scale,
      y: panelY + 4 * scale + 16 * scale,
    },
    force: true,
  });
  await canvas.tap({
    position: {
      x: panelX + (64 + 3 * 48) * scale + 16 * scale,
      y: panelY + 4 * scale + 16 * scale,
    },
    force: true,
  });
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-popup", "stats");
  await canvas.tap({ position: { x: 10, y: 60 }, force: true });
  await expect(page.locator("#app")).not.toHaveAttribute("data-serfbound-popup", /.+/);
});
