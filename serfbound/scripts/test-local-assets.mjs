import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const enabled = process.env["SERFBOUND_RUN_LOCAL_ASSET_TESTS"] === "1";

if (!enabled) {
  console.log(
    "serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.",
  );
  process.exit(0);
}

const configuredPath = process.env["SERFBOUND_SPAU_PA"];

if (configuredPath === undefined || configuredPath.trim() === "") {
  console.log(
    "serfbound-local-asset-tests-enabled: set SERFBOUND_SPAU_PA to validate a local file.",
  );
  process.exit(0);
}

const fileName = basename(configuredPath);
if (fileName.toLowerCase() !== "spau.pa") {
  console.error(
    `serfbound-local-asset-tests-failed: expected SPAU.PA, received ${fileName}.`,
  );
  process.exit(1);
}

if (!existsSync(configuredPath)) {
  console.error(
    `serfbound-local-asset-tests-failed: local SPAU.PA path does not exist: ${configuredPath}.`,
  );
  process.exit(1);
}

let buildTypedAssetCatalog;
let parseDosPaCatalog;
try {
  ({ buildTypedAssetCatalog, parseDosPaCatalog } = await import("../packages/assets/dist/index.js"));
} catch (error) {
  console.error(
    "serfbound-local-asset-tests-failed: build @serfbound/assets before running local asset tests.",
  );
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const oracleUrl = new URL(
  "../../serfbound-local-data/reference-output/spau-catalog-metadata.json",
  import.meta.url,
);

if (!existsSync(oracleUrl)) {
  console.log(
    "serfbound-local-asset-tests-enabled: local SPAU.PA parsed, but Phase 1 oracle metadata is not present.",
  );
  process.exit(0);
}

const [archiveBytes, oracleBytes] = await Promise.all([
  readFile(configuredPath),
  readFile(oracleUrl, "utf8"),
]);
const catalog = parseDosPaCatalog(archiveBytes);
const typedCatalog = buildTypedAssetCatalog(catalog);
const oracle = JSON.parse(oracleBytes);

assert.deepEqual(catalog.header, oracle.archive.header);
assert.deepEqual(
  {
    defined: catalog.entrySummary.defined,
    undefined: catalog.entrySummary.undefined,
    totalWithPlaceholder: catalog.entrySummary.totalWithPlaceholder,
    invalidBoundsCount: catalog.entrySummary.invalidBoundsCount,
    overlapCount: catalog.entrySummary.overlapCount,
    sizeStats: catalog.entrySummary.sizeStats,
    largestEntries: catalog.entrySummary.largestEntries,
  },
  {
    defined: oracle.archive.entrySummary.defined,
    undefined: oracle.archive.entrySummary.undefined,
    totalWithPlaceholder: oracle.archive.entrySummary.totalWithPlaceholder,
    invalidBoundsCount: oracle.archive.entrySummary.invalidBoundsCount,
    overlapCount: oracle.archive.entrySummary.overlapCount,
    sizeStats: oracle.archive.entrySummary.sizeStats,
    largestEntries: oracle.archive.entrySummary.largestEntries,
  },
);
assert.equal(catalog.fixupSummary.count, oracle.archive.fixupSummary.count);
assert.deepEqual(catalog.fixupSummary.samples, oracle.archive.fixupSummary.samples);
assert.deepEqual(catalog.selectedEntries, oracle.archive.selectedEntries);

for (const resourceIndex of [1, 2, 10, 15, 24, 28, 29, 31, 32, 33]) {
  assert.deepEqual(catalog.resources[resourceIndex], oracle.resources[String(resourceIndex)]);
}

const typedExpectations = [
  ["renderer.mapGround", typedCatalog.requests.renderer.mapGround, "map_ground", "available"],
  ["renderer.mapObjects", typedCatalog.requests.renderer.mapObjects, "map_object", "partial"],
  ["renderer.gameObjects", typedCatalog.requests.renderer.gameObjects, "game_object", "partial"],
  ["renderer.mapShadows", typedCatalog.requests.renderer.mapShadows, "map_shadow", "partial"],
  ["ui.font", typedCatalog.requests.ui.font, "font", "available"],
  ["ui.icons", typedCatalog.requests.ui.icons, "icon", "available"],
  ["ui.cursor", typedCatalog.requests.ui.cursor, "cursor", "available"],
  ["audio.soundEffects", typedCatalog.requests.audio.soundEffects, "sound", "partial"],
  ["audio.music", typedCatalog.requests.audio.music, "music", "partial"],
];

for (const [label, resource, expectedName, expectedStatus] of typedExpectations) {
  assert.equal(resource.name, expectedName, `${label} name`);
  assert.equal(resource.availability.status, expectedStatus, `${label} status`);
  assert.equal("offset" in resource.reference, false, `${label} hides archive offsets`);
}

assert.equal(
  typedCatalog.groups.serfs.resources.some((resource) => resource.name === "serf_torso"),
  true,
);
assert.equal(
  typedCatalog.groups.audio.resources.some((resource) => resource.name === "music"),
  true,
);

console.log(
  `serfbound-local-asset-tests-ok: parsed ${fileName} catalog and matched Phase 1 oracle metadata plus typed catalog facts.`,
);
