import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DosPaArchive,
  DosSpriteDecodeError,
  decodeDosMaskSprite,
  decodeDosOverlaySprite,
  decodeDosResourceSprite,
  decodeDosSolidSprite,
  decodeDosTransparentSprite,
  dosSpriteArchiveIndex,
} from "@serfbound/assets";

function spriteHeader({ deltaX = 0, deltaY = 0, width, height, offsetX = 0, offsetY = 0 }) {
  const bytes = new Uint8Array(10);
  const view = new DataView(bytes.buffer);
  view.setInt8(0, deltaX);
  view.setInt8(1, deltaY);
  view.setUint16(2, width, true);
  view.setUint16(4, height, true);
  view.setInt16(6, offsetX, true);
  view.setInt16(8, offsetY, true);
  return bytes;
}

function spritePayload(header, body) {
  const bytes = new Uint8Array(header.length + body.length);
  bytes.set(header, 0);
  bytes.set(body, header.length);
  return bytes;
}

function createPayloadPaArchive(entryPayloads) {
  const entryCount = Math.max(...entryPayloads.map((entry) => entry.index));
  const tableStart = 8;
  const tableEnd = tableStart + entryCount * 8;
  let cursor = tableEnd;
  const placements = entryPayloads.map((entry) => {
    const placement = { ...entry, offset: cursor };
    cursor += entry.bytes.length;
    return placement;
  });

  const bytes = new Uint8Array(cursor);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, cursor, true);
  view.setUint32(4, entryCount, true);

  for (const placement of placements) {
    const tableOffset = tableStart + (placement.index - 1) * 8;
    view.setUint32(tableOffset, placement.bytes.length, true);
    view.setUint32(tableOffset + 4, placement.offset, true);
    bytes.set(placement.bytes, placement.offset);
  }

  return bytes;
}

function generatedPalette() {
  const palette = new Uint8Array(768);
  for (let index = 0; index < 256; index += 1) {
    palette[index * 3] = index;
    palette[index * 3 + 1] = 255 - index;
    palette[index * 3 + 2] = index ^ 0x55;
  }

  return palette;
}

function paletteRgba(palette, paletteIndex, alpha = 0xff) {
  return [
    palette[paletteIndex * 3],
    palette[paletteIndex * 3 + 1],
    palette[paletteIndex * 3 + 2],
    alpha,
  ];
}

const palette = generatedPalette();
const fixtureArchiveBytes = createPayloadPaArchive([
  { index: 3, bytes: palette },
  {
    // map_mask_up sprite 0 lives at archive entry 60.
    index: 60,
    bytes: spritePayload(spriteHeader({ width: 2, height: 2, offsetY: -3 }), [0, 2, 1, 1]),
  },
  {
    // map_ground sprite 0 lives at archive entry 260.
    index: 260,
    bytes: spritePayload(
      spriteHeader({ deltaX: 1, deltaY: -2, width: 2, height: 3, offsetX: -4, offsetY: 5 }),
      [0, 1, 2, 3, 4, 5],
    ),
  },
  {
    // map_object flag frame 0 lives at archive entry 1250 + 128.
    index: 1378,
    bytes: spritePayload(spriteHeader({ width: 4, height: 1 }), [1, 2, 10, 11]),
  },
  {
    // map_shadow sprite 0 lives at archive entry 1500.
    index: 1500,
    bytes: spritePayload(spriteHeader({ width: 2, height: 2 }), [1, 2, 1, 0]),
  },
]);

test("DOS solid sprites decode palette indices into RGBA pixels", () => {
  const archive = new DosPaArchive(fixtureArchiveBytes);
  const sprite = decodeDosSolidSprite(archive.getEntryBytes(260), archive.getPalette(3));

  assert.deepEqual(
    {
      deltaX: sprite.deltaX,
      deltaY: sprite.deltaY,
      width: sprite.width,
      height: sprite.height,
      offsetX: sprite.offsetX,
      offsetY: sprite.offsetY,
    },
    { deltaX: 1, deltaY: -2, width: 2, height: 3, offsetX: -4, offsetY: 5 },
  );
  assert.deepEqual(
    Array.from(sprite.rgba),
    [0, 1, 2, 3, 4, 5].flatMap((paletteIndex) => paletteRgba(palette, paletteIndex)),
  );
});

test("DOS transparent sprites decode drop/fill runs and honor the color offset", () => {
  const archive = new DosPaArchive(fixtureArchiveBytes);
  const sprite = decodeDosTransparentSprite(archive.getEntryBytes(1378), archive.getPalette(3));

  assert.equal(sprite.width, 4);
  assert.equal(sprite.height, 1);
  assert.deepEqual(
    Array.from(sprite.rgba),
    [[0, 0, 0, 0], paletteRgba(palette, 10), paletteRgba(palette, 11), [0, 0, 0, 0]].flat(),
  );

  const shifted = decodeDosTransparentSprite(
    archive.getEntryBytes(1378),
    archive.getPalette(3),
    64,
  );
  assert.deepEqual(Array.from(shifted.rgba.subarray(4, 8)), paletteRgba(palette, 74));
});

test("DOS overlay sprites decode runs into a fixed palette value with overlay alpha", () => {
  const archive = new DosPaArchive(fixtureArchiveBytes);
  const sprite = decodeDosOverlaySprite(archive.getEntryBytes(1500), archive.getPalette(3));

  assert.equal(sprite.width, 2);
  assert.equal(sprite.height, 2);
  assert.deepEqual(
    Array.from(sprite.rgba),
    [
      [0, 0, 0, 0],
      paletteRgba(palette, 0x80, 0x80),
      paletteRgba(palette, 0x80, 0x80),
      [0, 0, 0, 0],
    ].flat(),
  );
});

test("DOS mask sprites decode runs into opaque white coverage", () => {
  const archive = new DosPaArchive(fixtureArchiveBytes);
  const sprite = decodeDosMaskSprite(archive.getEntryBytes(60));

  assert.equal(sprite.width, 2);
  assert.equal(sprite.height, 2);
  assert.equal(sprite.offsetY, -3);
  assert.deepEqual(
    Array.from(sprite.rgba),
    [[255, 255, 255, 255], [255, 255, 255, 255], [0, 0, 0, 0], [255, 255, 255, 255]].flat(),
  );
});

test("malformed DOS sprite payloads raise typed decode errors", () => {
  const archive = new DosPaArchive(fixtureArchiveBytes);
  const dosPalette = archive.getPalette(3);

  assert.throws(
    () => decodeDosSolidSprite(new Uint8Array([1, 2, 3]), dosPalette),
    DosSpriteDecodeError,
  );
  assert.throws(
    () =>
      decodeDosSolidSprite(
        spritePayload(spriteHeader({ width: 2, height: 2 }), [0, 1, 2]),
        dosPalette,
      ),
    DosSpriteDecodeError,
  );
  assert.throws(
    () =>
      decodeDosTransparentSprite(
        spritePayload(spriteHeader({ width: 1, height: 1 }), [0, 2, 1, 2]),
        dosPalette,
      ),
    DosSpriteDecodeError,
  );
  assert.throws(
    () => decodeDosSolidSprite(archive.getEntryBytes(260), new Uint8Array(10)),
    DosSpriteDecodeError,
  );
});

test("resource-level decoding maps names, flag frames, and missing entries", () => {
  const archive = new DosPaArchive(fixtureArchiveBytes);

  assert.equal(dosSpriteArchiveIndex("map_ground", 0), 260);
  assert.equal(dosSpriteArchiveIndex("map_mask_up", 0), 60);
  assert.equal(dosSpriteArchiveIndex("map_object", 130), 1380);
  assert.equal(dosSpriteArchiveIndex("map_object", 133), 1379);
  assert.throws(() => dosSpriteArchiveIndex("map_ground", 33), DosSpriteDecodeError);
  assert.throws(() => dosSpriteArchiveIndex("sound", 0), DosSpriteDecodeError);

  const ground = decodeDosResourceSprite(archive, "map_ground", 0);
  assert.equal(ground.width, 2);
  assert.equal(ground.height, 3);

  const mask = decodeDosResourceSprite(archive, "map_mask_up", 0);
  assert.equal(mask.rgba[3], 255);

  const flag = decodeDosResourceSprite(archive, "map_object", 128);
  assert.equal(flag.width, 4);

  const shadow = decodeDosResourceSprite(archive, "map_shadow", 0);
  assert.equal(shadow.rgba[7], 0x80);

  assert.equal(decodeDosResourceSprite(archive, "map_ground", 1), null);
});
