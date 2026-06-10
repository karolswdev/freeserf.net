import { expect, test, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-23-04 (gate, part 2): the two-tab async match — offline-chess
// Serfbound. Each tab runs the full simulation; window moves cross the
// loopback channel (the Phase 24 mailbox's stand-in); each side picks
// up at its own pace, watches the recap, and plays.

async function importData(page: Page): Promise<void> {
  await page.goto("/?seed=6235842872325272&window=512");
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
}

async function probeCastle(page: Page): Promise<void> {
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no bounding box");
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = 60 + (attempt % 6) * Math.floor((box.width - 120) / 5);
    const y = 90 + Math.floor(attempt / 6) * Math.floor((box.height - 180) / 4);
    await canvas.click({ position: { x, y }, force: true });
  }
}

test("two tabs play an async correspondence match at their own pace", async ({ context }) => {
  test.setTimeout(240_000);
  const hostPage = await context.newPage();
  const joinPage = await context.newPage();
  await importData(hostPage);
  await importData(joinPage);
  const hostApp = hostPage.locator("#app");
  const joinApp = joinPage.locator("#app");

  await hostPage.getByTestId("async-host-button").click();
  await expect(hostApp).toHaveAttribute("data-serfbound-cor-mode", "waiting-peer");
  await joinPage.getByTestId("async-join-button").click();

  // Handshake: window 0 belongs to the host; the joiner waits.
  await expect(hostApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 15_000,
  });
  await expect(joinApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 15_000,
  });

  // The host plays window 0 (founding); the move crosses at the bound.
  await hostPage.bringToFront();
  await probeCastle(hostPage);
  await expect(hostApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 30_000,
  });
  await expect(joinApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 15_000,
  });

  // The joiner picks it up whenever they like: recap (trustless
  // verification), then their own window.
  await joinPage.bringToFront();
  await joinPage.keyboard.press("Enter");
  await expect(joinApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await expect(joinApp).toHaveAttribute("data-serfbound-cor-digest", /BLD/);
  await expect(joinApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);

  // The joiner plays window 1; the host recaps it.
  await probeCastle(joinPage);
  await expect(joinApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 30_000,
  });
  await hostPage.bringToFront();
  await expect(hostApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 15_000,
  });
  await hostPage.keyboard.press("Enter");
  await expect(hostApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });

  // Both tabs verified to the same state: the last shared window
  // boundary's checksum is identical (live ticks advance independently,
  // so the boundary fingerprint is the stable comparison).
  const hostBoundary = await hostApp.getAttribute("data-serfbound-cor-boundary");
  expect(hostBoundary).toMatch(/\d+/);
  await expect(joinApp).toHaveAttribute("data-serfbound-cor-boundary", hostBoundary as string);
  await expect(hostApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);
  await expect(joinApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);
  await expect(hostApp).toHaveAttribute("data-serfbound-cor-window", "2");
});
