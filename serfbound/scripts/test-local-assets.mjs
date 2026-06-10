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
let createFirstRenderLayerScene;
let parseDosPaCatalog;
try {
  ({ buildTypedAssetCatalog, parseDosPaCatalog } = await import("../packages/assets/dist/index.js"));
  ({ createFirstRenderLayerScene } = await import("../packages/app/dist/main.js"));
} catch (error) {
  console.error(
    "serfbound-local-asset-tests-failed: build @serfbound/assets and @serfbound/app before running local asset tests.",
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

const scene = createFirstRenderLayerScene({ typedAssetCatalog: typedCatalog });
assert.equal(scene.renderer, "webgl2");
assert.equal(scene.assetSummary.source, "dos-pa-catalog");
assert.equal(scene.assetSummary.definedArchiveEntries, typedCatalog.source.definedArchiveEntries);
assert.equal(scene.assetSummary.mapGroundStatus.startsWith("available:"), true);
assert.equal(scene.assetSummary.mapObjectsStatus.startsWith("partial:"), true);
assert.equal(scene.layers.length, 5);
assert.equal(scene.primitives.length > 100, true);

// SB-10-01: real DOS palette and sprite payloads must decode, not just catalog.
const { DosPaArchive, decodeDosResourceSprite } = await import(
  "../packages/assets/dist/index.js"
);
const spriteArchive = new DosPaArchive(archiveBytes, catalog);

for (const paletteIndex of [3, 3997, 3998]) {
  const dosPalette = spriteArchive.getPalette(paletteIndex);
  assert.notEqual(dosPalette, null, `palette ${paletteIndex} decodes`);
  assert.equal(dosPalette.byteLength, 768, `palette ${paletteIndex} is 256 RGB triples`);
}

for (let groundIndex = 0; groundIndex < 33; groundIndex += 1) {
  const ground = decodeDosResourceSprite(spriteArchive, "map_ground", groundIndex);
  assert.notEqual(ground, null, `map_ground ${groundIndex} decodes`);
  assert.equal(ground.width, 32, `map_ground ${groundIndex} width`);
  assert.equal(ground.height, 20, `map_ground ${groundIndex} height`);
  assert.equal(
    ground.rgba.some((value, index) => index % 4 === 3 && value === 0xff),
    true,
    `map_ground ${groundIndex} has opaque pixels`,
  );
}

let decodedUpMasks = 0;
let decodedDownMasks = 0;
for (let maskIndex = 0; maskIndex < 81; maskIndex += 1) {
  const up = decodeDosResourceSprite(spriteArchive, "map_mask_up", maskIndex);
  if (up !== null) {
    decodedUpMasks += 1;
    assert.equal(up.width <= 32 && up.height <= 41, true, `map_mask_up ${maskIndex} bounds`);
  }

  const down = decodeDosResourceSprite(spriteArchive, "map_mask_down", maskIndex);
  if (down !== null) {
    decodedDownMasks += 1;
    assert.equal(down.width <= 32 && down.height <= 41, true, `map_mask_down ${maskIndex} bounds`);
  }
}

assert.equal(decodedUpMasks, 61, "61 up masks decode (reference atlas count)");
assert.equal(decodedDownMasks, 61, "61 down masks decode (reference atlas count)");

const flagSprite = decodeDosResourceSprite(spriteArchive, "map_object", 128);
assert.notEqual(flagSprite, null, "map_object flag frame decodes");
assert.equal(flagSprite.width > 0 && flagSprite.height > 0, true, "flag has dimensions");
assert.equal(
  flagSprite.rgba.some((value, index) => index % 4 === 3 && value === 0xff),
  true,
  "flag has opaque pixels",
);

const treeSprite = decodeDosResourceSprite(spriteArchive, "map_object", 0);
assert.notEqual(treeSprite, null, "map_object tree sprite decodes");
const treeShadow = decodeDosResourceSprite(spriteArchive, "map_shadow", 0);
assert.notEqual(treeShadow, null, "map_shadow tree shadow decodes");
assert.equal(
  treeShadow.rgba.some((value, index) => index % 4 === 3 && value === 0x80),
  true,
  "tree shadow uses overlay alpha",
);

console.log(
  `serfbound-local-asset-tests-ok: parsed ${fileName} catalog, matched Phase 1 oracle metadata, and decoded real palettes, terrain sprites, ${decodedUpMasks + decodedDownMasks} masks, and object sprites.`,
);
