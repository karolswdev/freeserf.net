import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import {
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  relative,
} from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(workspaceRoot, "dist");
const mountPath = "/serfbound/";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

if (!existsSync(distRoot)) {
  throw new Error("dist artifact is missing; run npm run release:static first.");
}

const indexHtml = await readFile(join(distRoot, "index.html"), "utf8");
if (
  indexHtml.includes('src="/assets/') ||
  indexHtml.includes('href="/assets/')
) {
  throw new Error(
    "dist/index.html uses root-absolute asset URLs; static subpath hosting would break.",
  );
}

const server = createServer((request, response) => {
  void serveStaticRequest(request.url ?? "/", response).catch((error) => {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : String(error));
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const address = server.address();
if (typeof address === "string" || address === null) {
  throw new Error("Could not determine static host port.");
}

const baseUrl = `http://127.0.0.1:${address.port}`;
const hostedUrl = `${baseUrl}${mountPath}`;
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  const response = await page.goto(hostedUrl);
  if (response?.status() !== 200) {
    throw new Error(
      `Expected hosted index to return 200, received ${response?.status() ?? "no response"}.`,
    );
  }
  assertCacheHeader(response.headers()["cache-control"], "no-cache", "index.html");

  const capability = await page.evaluate(() => ({
    fileApi: "File" in window && "FileReader" in window,
    indexedDb: "indexedDB" in window,
    origin: location.origin,
    pathname: location.pathname,
  }));

  if (!capability.fileApi || !capability.indexedDb) {
    throw new Error(
      `Hosted origin lacks browser import/storage APIs: ${JSON.stringify(capability)}.`,
    );
  }
  if (capability.pathname !== mountPath) {
    throw new Error(`Expected app to load at ${mountPath}, received ${capability.pathname}.`);
  }

  await page.locator("[data-testid='serfbound-shell']").waitFor({ state: "visible" });
  const runtime = await page.locator("#app").getAttribute("data-serfbound-runtime");
  if (runtime !== "browser") {
    throw new Error(`Expected browser runtime marker, received ${runtime ?? "missing"}.`);
  }

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: createGeneratedPaArchive(),
  });
  await waitForText(page, "data-state", "Data imported");
  await waitForText(page, "data-detail", "2 resources loaded and saved.");
  await page.reload();
  await waitForText(page, "data-state", "Data imported");
  await waitForText(page, "data-detail", "SPAU.PA restored with 2 resources.");

  const assetResponse = await page.request.get(`${hostedUrl}assets/${await firstDistAssetName()}`);
  if (assetResponse.status() !== 200) {
    throw new Error(`Expected hosted asset to return 200, received ${assetResponse.status()}.`);
  }
  assertCacheHeader(assetResponse.headers()["cache-control"], "immutable", "hashed asset");
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
}

console.log(
  `serfbound-static-hosting-ok: served dist at ${mountPath}, imported generated SPAU.PA, and restored IndexedDB state after reload.`,
);

async function serveStaticRequest(url, response) {
  const parsed = new URL(url, "http://127.0.0.1");
  if (!parsed.pathname.startsWith(mountPath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const pathWithinMount =
    decodeURIComponent(parsed.pathname.slice(mountPath.length)) || "index.html";
  const normalizedPath = normalize(pathWithinMount);
  if (normalizedPath.startsWith("..") || isAbsolute(normalizedPath)) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid path");
    return;
  }

  const filePath = join(distRoot, normalizedPath);
  const relativePath = relative(distRoot, filePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid path");
    return;
  }

  const fileStat = await stat(filePath).catch(() => undefined);
  if (fileStat === undefined || !fileStat.isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = extname(filePath);
  const headers = {
    "Cache-Control": relativePath.startsWith("assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
  };
  response.writeHead(200, headers);
  response.end(await readFile(filePath));
}

function createGeneratedPaArchive() {
  const bytes = Buffer.alloc(32);
  bytes.writeUInt32LE(bytes.length, 0);
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(4, 8);
  bytes.writeUInt32LE(24, 12);
  bytes.writeUInt32LE(4, 16);
  bytes.writeUInt32LE(28, 20);
  return bytes;
}

async function waitForText(page, testId, text) {
  await page.waitForFunction(
    ({ selector, expected }) =>
      document.querySelector(selector)?.textContent === expected,
    { selector: `[data-testid='${testId}']`, expected: text },
  );
}

async function firstDistAssetName() {
  const assetMatch = indexHtml.match(/(?:src|href)="\.\/assets\/([^"]+)"/);
  if (assetMatch?.[1] === undefined) {
    throw new Error("Could not find a relative hashed asset in dist/index.html.");
  }
  return assetMatch[1];
}

function assertCacheHeader(header, expectedToken, label) {
  if (header === undefined || !header.includes(expectedToken)) {
    throw new Error(
      `Expected ${label} Cache-Control to include ${expectedToken}, received ${header ?? "missing"}.`,
    );
  }
}
