import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildTypedAssetCatalog,
  lookupTypedAssetResource,
  parseDosPaCatalog,
} from "@serfbound/assets";

function createGeneratedPaArchive(entryCount, entryFacts) {
  const tableStart = 8;
  const tableEnd = tableStart + entryCount * 8;
  const payloadEnd = Math.max(
    tableEnd,
    ...entryFacts.map((entry) => entry.offset + entry.size),
  );
  const bytes = new Uint8Array(payloadEnd);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, payloadEnd, true);
  view.setUint32(4, entryCount, true);

  for (const entry of entryFacts) {
    const tableOffset = tableStart + (entry.index - 1) * 8;
    view.setUint32(tableOffset, entry.size, true);
    view.setUint32(tableOffset + 4, entry.offset, true);
  }

  return bytes;
}

test("typed asset catalog groups DOS resources by semantic consumer area", () => {
  const archive = createGeneratedPaArchive(4000, [
    { index: 3, offset: 32008, size: 768 },
    { index: 260, offset: 32776, size: 16 },
    { index: 261, offset: 32792, size: 16 },
    { index: 300, offset: 32808, size: 16 },
    { index: 321, offset: 32824, size: 16 },
    { index: 750, offset: 32840, size: 16 },
    { index: 870, offset: 32856, size: 16 },
    { index: 1250, offset: 32872, size: 16 },
    { index: 2500, offset: 32888, size: 16 },
    { index: 3150, offset: 32904, size: 16 },
    { index: 3900, offset: 32920, size: 16 },
    { index: 3990, offset: 32936, size: 16 },
  ]);

  const typedCatalog = buildTypedAssetCatalog(parseDosPaCatalog(archive));

  assert.equal(typedCatalog.source.entryCount, 4000);
  assert.equal(typedCatalog.groups.terrain.resources.some((resource) => resource.name === "map_ground"), true);
  assert.equal(typedCatalog.groups.objects.resources.some((resource) => resource.name === "map_object"), true);
  assert.equal(typedCatalog.groups.serfs.resources.some((resource) => resource.name === "serf_torso"), true);
  assert.equal(typedCatalog.groups.ui.resources.some((resource) => resource.name === "font"), true);
  assert.equal(typedCatalog.groups.audio.resources.some((resource) => resource.name === "sound"), true);

  assert.deepEqual(typedCatalog.requests.renderer.mapGround.reference, {
    source: "dos-pa-resource",
    resourceIndex: 13,
    name: "map_ground",
    dosIndex: 260,
    count: 33,
  });
  assert.equal("offset" in typedCatalog.requests.renderer.mapGround.reference, false);
  assert.equal(typedCatalog.requests.renderer.mapGround.availability.status, "partial");
  assert.equal(typedCatalog.requests.renderer.mapGround.availability.availableCount, 2);
  assert.equal(typedCatalog.requests.renderer.mapObjects.availability.status, "partial");
  assert.equal(typedCatalog.requests.audio.soundEffects.decoderStatus, "sound-decoder-deferred");
  assert.equal(typedCatalog.requests.audio.music.decoderStatus, "music-decoder-deferred");
  assert.equal(typedCatalog.requests.ui.font.decoderStatus, "sprite-decoder-deferred");
  assert.equal(typedCatalog.requests.ui.font.palette.status, "available");
});

test("typed asset catalog represents missing groups explicitly and supports lookup", () => {
  const archive = createGeneratedPaArchive(4000, [
    { index: 3, offset: 32008, size: 768 },
    { index: 260, offset: 32776, size: 16 },
  ]);

  const typedCatalog = buildTypedAssetCatalog(parseDosPaCatalog(archive));
  const gameObject = lookupTypedAssetResource(typedCatalog, "game_object");
  const sound = lookupTypedAssetResource(typedCatalog, "sound");

  assert.equal(gameObject?.availability.status, "missing");
  assert.equal(sound?.availability.status, "missing");
  assert.equal(typedCatalog.groups.objects.missingResourceNames.includes("game_object"), true);
  assert.equal(typedCatalog.groups.audio.missingResourceNames.includes("sound"), true);
  assert.equal(lookupTypedAssetResource(typedCatalog, "not_a_resource"), undefined);
});
