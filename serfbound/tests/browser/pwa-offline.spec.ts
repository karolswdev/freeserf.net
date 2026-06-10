import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-19-04: the installable PWA shell works offline — the service worker
// caches the app shell, and the user's imported data (IndexedDB) plays
// without a network. Original game data is never cached by the worker.
test("the app shell installs, then boots offline with imported data intact", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");

  // The manifest is wired and the service worker activates.
  await expect(page.locator("link[rel='manifest']")).toHaveAttribute(
    "href",
    "./manifest.webmanifest",
  );
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker?.ready;
    return registration?.active?.state === "activated";
  });

  // Import data (it lands in IndexedDB, not the worker cache).
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  // Give the worker a beat to cache the shell responses it has seen.
  await page.waitForTimeout(1000);

  // Offline: the shell boots from the cache and the data restores from
  // IndexedDB.
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported", {
    timeout: 15_000,
  });
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-scene-source",
    "dos-pa-decoded",
  );

  // The game starts and plays offline.
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no bounding box");
  }

  const scale = box.width < 700 ? 1 : 2;
  const initX = Math.max(0, Math.floor((box.width - 144 * scale) / 2));
  const initY = Math.max(0, Math.floor((box.height - 128 * scale) / 3));
  await canvas.click({
    position: { x: initX + 72 * scale, y: initY + 104 * scale + 5 * scale },
    force: true,
  });
  await expect(page.getByTestId("game-state")).toHaveText("Running");

  await context.setOffline(false);
});
