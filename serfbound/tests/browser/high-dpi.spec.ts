import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-21-03: on a high-DPI display the canvas backing store renders at
// native device resolution (no browser upscale blur), pointer play still
// works, and the world view scale cycles.
test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
});

test("a DPR-2 display renders native-resolution and plays by pointer", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/?seed=6235842872325272");

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

  // The backing store matches physical pixels: CSS size * DPR.
  const app = page.locator("#app");
  await expect(app).toHaveAttribute("data-serfbound-pixel-ratio", "2");
  const backingWidth = Number(await app.getAttribute("data-serfbound-canvas-width"));
  expect(Math.abs(backingWidth - Math.round(box.width * 2))).toBeLessThanOrEqual(2);

  // The init screen still works in CSS pixels (uiScale follows the DPR).
  const scale = box.width < 700 ? 1 : 2;
  const initX = Math.max(0, Math.floor((box.width - 144 * scale) / 2));
  const initY = Math.max(0, Math.floor((box.height - 128 * scale) / 3));
  await canvas.click({
    position: { x: initX + 72 * scale, y: initY + 104 * scale + 5 * scale },
    force: true,
  });
  await expect(page.getByTestId("game-state")).toHaveText("Running");

  // The default world view follows the screen (2x on DPR 2).
  await expect(app).toHaveAttribute("data-serfbound-view-scale", "2");

  // Pointer play works at DPR 2: found the castle by clicking the map.
  const probeBox = (await canvas.boundingBox()) ?? box;
  for (let attempt = 0; attempt < 56; attempt += 1) {
    const x = 24 + (attempt % 7) * Math.floor((probeBox.width - 48) / 6);
    const y = 70 + Math.floor(attempt / 7) * Math.floor((probeBox.height - 130) / 7);
    await canvas.click({ position: { x, y }, force: true });
    if ((await app.getAttribute("data-serfbound-world-has-castle")) === "true") {
      break;
    }
  }
  await expect(app).toHaveAttribute("data-serfbound-world-has-castle", "true");

  // The view scale cycles from the shell control and the game keeps
  // running.
  await page.getByTestId("view-scale-button").click();
  await expect(app).toHaveAttribute("data-serfbound-view-scale", "3");
  await page.getByTestId("view-scale-button").click();
  await expect(app).toHaveAttribute("data-serfbound-view-scale", "1");
  await expect(page.getByTestId("game-state")).toHaveText("Running");
});
