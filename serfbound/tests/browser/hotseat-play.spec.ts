import { expect, test, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-23-04 (gate, part 1): hot-seat correspondence on one machine —
// play a window, hand the seat over against the countdown, watch the
// recap (the trustless verify path), play the next window.

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

test("a hot-seat match plays windows through handover, recap, and back", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/?seed=6235842872325272&window=512");
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  await page.getByTestId("hotseat-button").click();
  const app = page.locator("#app");
  await expect(app).toHaveAttribute("data-serfbound-cor-mode", "your-window");
  await expect(app).toHaveAttribute("data-serfbound-cor-player", "0");
  await expect(page.getByTestId("game-state")).toHaveText("Running");

  // Player 1 founds their castle inside the window.
  await probeCastle(page);

  // The window ends on its own; the hand-over screen counts down.
  await expect(app).toHaveAttribute("data-serfbound-cor-mode", "handover", {
    timeout: 30_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-cor-player", "1");
  await expect(app).toHaveAttribute("data-serfbound-cor-countdown", /\d+/);

  // Player 2 picks up: the recap replays player 1's window (the
  // trustless verify), then their window begins with the digest shown.
  await page.keyboard.press("Enter");
  await expect(app).toHaveAttribute("data-serfbound-cor-mode", "recap");
  await expect(app).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-cor-digest", /BLD/);
  await expect(app).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);

  // Player 2 plays their window (their own castle) and hands back.
  await probeCastle(page);
  await expect(app).toHaveAttribute("data-serfbound-cor-mode", "handover", {
    timeout: 30_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-cor-player", "0");
  await page.keyboard.press("Enter");
  await expect(app).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });

  // The second window's digest records player 2's founding; the match
  // never failed verification.
  await expect(app).toHaveAttribute("data-serfbound-cor-digest", /P2.*BLD|P2.*QUIET/);
  await expect(app).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);
  await expect(app).toHaveAttribute("data-serfbound-cor-window", "2");
});
