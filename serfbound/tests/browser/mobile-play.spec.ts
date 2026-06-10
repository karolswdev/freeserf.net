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

  // Narrow canvas: the chrome drops to 1x, so the init box is 144x128.
  const scale = box.width < 700 ? 1 : 2;
  const initX = Math.max(0, Math.floor((box.width - 144 * scale) / 2));
  const initY = Math.max(0, Math.floor((box.height - 128 * scale) / 3));
  await canvas.tap({ position: { x: initX + 72 * scale, y: initY + 104 * scale + 5 * scale }, force: true });
  await expect(page.getByTestId("game-state")).toHaveText("Running");

  // Found the castle by tapping the map: probe a grid over the whole
  // visible map (valid sites are terrain-dependent per generated world).
  // The layout can shift once the status panel reports the running game,
  // so measure the canvas fresh before probing. Probes dispatch
  // synthetic down+up pairs — Playwright's tap() can straddle the 500ms
  // long-press threshold on a loaded CI machine, turning the tap into
  // a tile inspect.
  const quickTap = (x: number, y: number) =>
    page.evaluate(
      ({ x, y }) => {
        const target = document.querySelector("[data-testid='terrain-preview']");
        if (target === null) {
          throw new Error("canvas missing");
        }

        const rect = target.getBoundingClientRect();
        for (const type of ["pointerdown", "pointerup"]) {
          target.dispatchEvent(
            new PointerEvent(type, {
              pointerId: 99,
              pointerType: "touch",
              isPrimary: true,
              clientX: rect.left + x,
              clientY: rect.top + y,
              bubbles: true,
              cancelable: true,
            }),
          );
        }
      },
      { x, y },
    );
  const probeBox = (await canvas.boundingBox()) ?? box;
  const probeColumns = 7;
  const probeRows = 8;
  const probeStepX = Math.floor((probeBox.width - 48) / (probeColumns - 1));
  const probeStepY = Math.floor((probeBox.height - 130) / (probeRows - 1));
  for (let attempt = 0; attempt < probeColumns * probeRows; attempt += 1) {
    const x = 24 + (attempt % probeColumns) * probeStepX;
    const y = 70 + Math.floor(attempt / probeColumns) * probeStepY;
    await quickTap(x, y);
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

  // SB-21-04: real hand gestures. Synthetic touch PointerEvents drive
  // the same listeners the device fires.
  const touch = (type: string, pointerId: number, x: number, y: number) =>
    page.evaluate(
      ({ type, pointerId, x, y }) => {
        const target = document.querySelector("[data-testid='terrain-preview']");
        if (target === null) {
          throw new Error("canvas missing");
        }

        const rect = target.getBoundingClientRect();
        target.dispatchEvent(
          new PointerEvent(type, {
            pointerId,
            pointerType: "touch",
            isPrimary: pointerId === 1,
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      { type, pointerId, x, y },
    );

  // Pinch out (fingers converge): the world view scale steps down from
  // the screen-density default (3 on this device profile).
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-view-scale", "3");
  await touch("pointerdown", 11, 100, 260);
  await touch("pointerdown", 12, 260, 260);
  await touch("pointermove", 12, 160, 260);
  await touch("pointerup", 12, 160, 260);
  await touch("pointerup", 11, 100, 260);
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-view-scale", "2");

  // Two-finger pan scrolls the map (alternating small moves keep the
  // pinch thresholds quiet).
  const scrollBefore = await page.locator("#app").getAttribute("data-serfbound-scroll");
  await touch("pointerdown", 21, 100, 300);
  await touch("pointerdown", 22, 200, 300);
  for (let step = 1; step <= 6; step += 1) {
    await touch("pointermove", 21, 100 + step * 15, 300);
    await touch("pointermove", 22, 200 + step * 15, 300);
  }
  await touch("pointerup", 21, 190, 300);
  await touch("pointerup", 22, 290, 300);
  const scrollAfter = await page.locator("#app").getAttribute("data-serfbound-scroll");
  expect(scrollAfter).not.toBe(scrollBefore);

  // Long-press inspects the tile without building anything.
  await touch("pointerdown", 31, 150, 350);
  await page.waitForTimeout(700);
  await touch("pointerup", 31, 150, 350);
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-long-press", /\d+,\d+/);
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-pointer-state", "selected");

  // Single-finger play still works after gestures.
  await expect(page.getByTestId("game-state")).toHaveText("Running");
});
