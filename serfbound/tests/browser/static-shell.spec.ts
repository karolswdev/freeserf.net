import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const screenshotPath =
  "../pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png";

function createGeneratedPaArchive(): Buffer {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32LE(bytes.length, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(4, 8);
  bytes.writeUInt32LE(24, 12);
  bytes.writeUInt32LE(4, 16);
  bytes.writeUInt32LE(28, 20);
  return bytes;
}

test("static app shell renders without original data or a desktop companion", async ({
  page,
}) => {
  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.goto("/");

  const shell = page.getByTestId("serfbound-shell");
  await expect(shell).toBeVisible();
  await expect(page.getByRole("heading", { name: "Serfbound" })).toBeVisible();
  await expect(page.getByTestId("runtime-pill")).toHaveText("Browser runtime");
  await expect(page.getByTestId("data-state")).toHaveText("No game data imported");

  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-runtime",
    "browser",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "missing",
  );

  await page.screenshot({ fullPage: true, path: screenshotPath });

  await page.getByTestId("data-import-input").setInputFiles({
    name: "README.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a supported archive"),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Unsupported data file");
  await expect(page.getByTestId("data-detail")).toHaveText("README.txt is not accepted");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "unsupported",
  );

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: createGeneratedPaArchive(),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Catalog parsed");
  await expect(page.getByTestId("data-detail")).toHaveText(
    "2 entries, 2 defined, 0 fixups",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-data-state",
    "supported",
  );
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-catalog-state",
    "parsed",
  );

  const nonBlankPixels = await page
    .getByTestId("terrain-preview")
    .evaluate((canvas) => {
      if (!(canvas instanceof HTMLCanvasElement)) {
        return 0;
      }

      const context = canvas.getContext("2d");
      if (context === null) {
        return 0;
      }

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      let count = 0;
      for (let index = 0; index < imageData.data.length; index += 4) {
        const red = imageData.data[index] ?? 0;
        const green = imageData.data[index + 1] ?? 0;
        const blue = imageData.data[index + 2] ?? 0;
        if (red > 40 || green > 40 || blue > 40) {
          count += 1;
        }
      }

      return count;
    });

  expect(nonBlankPixels).toBeGreaterThan(120_000);
});
