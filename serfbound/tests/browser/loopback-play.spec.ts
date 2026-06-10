import { expect, test, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-22-04: the Phase 22 gate — two browser tabs on one origin play one
// lockstep game over a BroadcastChannel with zero servers. Both players
// act, both worlds show both castles, and the periodic state checksums
// agree across the tabs.

async function importData(page: Page): Promise<void> {
  await page.goto("/?seed=6235842872325272");
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
}

async function probeCastleClicks(page: Page): Promise<void> {
  const canvas = page.getByTestId("terrain-preview");
  const box = await canvas.boundingBox();
  if (box === null) {
    throw new Error("canvas has no bounding box");
  }

  // Queue castle attempts across the visible map; the first valid site
  // wins at its lockstep turn, later ones reject deterministically on
  // both peers.
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = 120 + (attempt % 6) * Math.floor((box.width - 160) / 5);
    const y = 90 + Math.floor(attempt / 6) * Math.floor((box.height - 170) / 4);
    await canvas.click({ position: { x, y }, force: true });
  }
}

test("two tabs host and join one lockstep game with agreeing checksums", async ({
  context,
}) => {
  test.setTimeout(180_000);
  const hostPage = await context.newPage();
  const joinPage = await context.newPage();
  await importData(hostPage);
  await importData(joinPage);

  // Host first, then join; the handshake adopts the host's settings.
  await hostPage.getByTestId("host-loopback-button").click();
  await expect(hostPage.locator("#app")).toHaveAttribute("data-serfbound-mp-phase", "waiting");
  await joinPage.getByTestId("join-loopback-button").click();

  for (const page of [hostPage, joinPage]) {
    await expect(page.locator("#app")).toHaveAttribute("data-serfbound-mp-phase", "running", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("game-state")).toHaveText("Running");
  }

  // Both players found their castles from their own tab (each brought
  // to front while acting — the visibility fix keeps the backgrounded
  // peer pumping regardless, just throttled).
  await hostPage.bringToFront();
  await probeCastleClicks(hostPage);
  await joinPage.bringToFront();
  await probeCastleClicks(joinPage);

  // Both worlds materialize both castles (lockstep applied each
  // player's action on each peer).
  for (const page of [hostPage, joinPage]) {
    await expect(page.locator("#app")).toHaveAttribute("data-serfbound-mp-castles", "1,1", {
      timeout: 60_000,
    });
  }

  // The periodic state checksums crossed the wire and agree on both
  // sides; nobody is stalled or desynced.
  for (const page of [hostPage, joinPage]) {
    await expect(page.locator("#app")).toHaveAttribute(
      "data-serfbound-mp-checksum-agreed",
      "true",
      { timeout: 60_000 },
    );
    await expect(page.locator("#app")).not.toHaveAttribute(
      "data-serfbound-mp-desync-tick",
      /.+/,
    );
    await expect(page.getByTestId("game-state")).toHaveText("Running");
  }
});
