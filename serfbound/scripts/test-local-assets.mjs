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
assert.equal(scene.layers.length, 6);
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

// SB-10-02: real ground + mask sprites must compose into terrain triangles
// and pack into the runtime atlas.
const { buildSpriteAtlas, composeMaskedTile } = await import(
  "../packages/assets/dist/index.js"
);

const flatUpMask = decodeDosResourceSprite(spriteArchive, "map_mask_up", 40);
const grassGround = decodeDosResourceSprite(spriteArchive, "map_ground", 0);
const composedTriangle = composeMaskedTile(grassGround, flatUpMask);
assert.equal(composedTriangle.width, flatUpMask.width, "composed triangle keeps mask width");
assert.equal(composedTriangle.height, flatUpMask.height, "composed triangle keeps mask height");
const composedOpaque = composedTriangle.rgba.filter(
  (value, index) => index % 4 === 3 && value === 0xff,
).length;
assert.equal(composedOpaque > 100, true, "composed triangle has substantial opaque coverage");
assert.equal(
  composedOpaque < composedTriangle.width * composedTriangle.height,
  true,
  "composed triangle is mask-shaped, not a full quad",
);

const realAtlas = buildSpriteAtlas({
  "tile:up:5:40": composedTriangle,
  "obj:flag": flagSprite,
  "obj:tree": treeSprite,
});
for (const key of ["tile:up:5:40", "obj:flag", "obj:tree"]) {
  assert.notEqual(realAtlas.regions[key], undefined, `atlas region ${key} exists`);
}
assert.equal(realAtlas.rgba.length, realAtlas.width * realAtlas.height * 4);

// SB-10-04: the full decoded scene path must work with real data.
const { buildDecodedRenderAssets, createFirstRenderLayerScene: createScene } = await import(
  "../packages/app/dist/main.js"
);
const decodedAssets = buildDecodedRenderAssets(archiveBytes, catalog);
assert.notEqual(decodedAssets, null, "real archive builds decoded render assets");
assert.equal(decodedAssets.source, "dos-pa-decoded");
assert.equal(decodedAssets.terrainTriangleCount > 10, true, "terrain combos composed");
for (const key of ["obj:tree", "obj:pine", "obj:stone", "obj:flag"]) {
  assert.equal(decodedAssets.objectKeys.includes(key), true, `${key} decoded from real data`);
}

const decodedScene = createScene({
  size: { width: 960, height: 540 },
  decodedAssets,
  builtStructures: [{ id: 1, kind: "flag", tile: { column: 3, row: 2, position: 11 } }],
});
assert.equal(decodedScene.assetSummary.source, "dos-pa-decoded");
assert.equal(decodedScene.sprites.length > 1000, true, "decoded scene fills the canvas");
assert.equal(
  decodedScene.sprites.filter((sprite) => sprite.key === "obj:flag").length,
  1,
  "built flag renders the real flag sprite",
);

// SB-13-01: the serf animation table and player-color torsos decode from
// real data.
const { composeSerfTorso, parseSerfAnimationTable } = await import(
  "../packages/assets/dist/index.js"
);
const animationTable = parseSerfAnimationTable(spriteArchive);
assert.equal(animationTable.length, 200, "200 serf animations");
assert.equal(
  animationTable.some((animation) => animation.length > 0),
  true,
  "animations carry frames",
);
assert.equal(
  animationTable.every((animation) =>
    animation.every(
      (frame) => frame.sprite >= 0 && frame.sprite <= 255 && Math.abs(frame.x) <= 127,
    ),
  ),
  true,
  "frames stay in range",
);

const torso = composeSerfTorso(spriteArchive, 0);
assert.notEqual(torso, null, "serf torso 0 composes");
assert.equal(torso.sprite.width > 0 && torso.sprite.height > 0, true);
const torsoMaskPixels = torso.playerMask.rgba.filter(
  (value, index) => index % 4 === 3 && value === 0xff,
).length;
assert.equal(torsoMaskPixels > 0, true, "player-color region exists");

// SB-17-01: real DOS sound effects decode to PCM16 at 8000 Hz.
const { decodeSfxSamples, sfxType, sfxSampleRate } = await import(
  "../packages/assets/dist/index.js"
);
assert.equal(sfxSampleRate, 8000);
let decodedSfxCount = 0;
for (const sfxId of Object.values(sfxType)) {
  const samples = decodeSfxSamples(spriteArchive, sfxId);
  if (samples !== null) {
    assert.equal(samples.length > 0, true, `sfx ${sfxId} has samples`);
    assert.equal(
      samples.some((sample) => sample !== samples[0]),
      true,
      `sfx ${sfxId} is not silence`,
    );
    decodedSfxCount += 1;
  }
}
assert.equal(decodedSfxCount > 20, true, "most reference clips decode from real data");

console.log(
  `serfbound-local-asset-tests-ok: parsed ${fileName} catalog, matched Phase 1 oracle metadata, decoded real palettes, terrain sprites, ${decodedUpMasks + decodedDownMasks} masks, object sprites, ${animationTable.length} serf animations, player-color torsos, and ${decodedSfxCount} DOS sound effects; composed terrain into a ${realAtlas.width}x${realAtlas.height} atlas and a decoded scene with ${decodedScene.sprites.length} sprites.`,
);
