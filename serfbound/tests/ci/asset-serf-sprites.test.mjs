import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DosPaArchive,
  composeSerfTorso,
  createDifferenceMask,
  getMasked,
  makeAlphaMask,
  parseSerfAnimationTable,
  stick,
} from "@serfbound/assets";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const archive = new DosPaArchive(createDecodableGeneratedPaArchive());

test("the serf animation table parses 200 animations with signed offsets", () => {
  const table = parseSerfAnimationTable(archive);
  assert.equal(table.length, 200);
  assert.equal(table[0].length, 4, "fixture animations carry four frames");
  assert.deepEqual(table[0][0], { sprite: 0, x: -2, y: 0 });
  assert.deepEqual(table[0][3], { sprite: 3, x: 1, y: -3 });
  assert.deepEqual(table[199][2], { sprite: (199 + 2) & 0xff, x: 0, y: -2 });
});

test("serf torsos compose with a player-color mask and arms", () => {
  const composed = composeSerfTorso(archive, 0);
  assert.notEqual(composed, null);
  assert.equal(composed.sprite.width, 16);
  assert.equal(composed.sprite.height, 16);
  assert.equal(composed.sprite.offsetY, -15, "torso keeps its anchor offsets");

  // The fixture palette differs at every +8 offset, so the whole torso is
  // player-colored.
  const maskOpaque = composed.playerMask.rgba.filter(
    (value, index) => index % 4 === 3 && value === 0xff,
  ).length;
  assert.equal(maskOpaque, 16 * 16, "player mask covers the torso");
});

test("the sprite pixel operations follow the reference semantics", () => {
  const square = (pixels) => ({
    deltaX: 0,
    deltaY: 0,
    width: 2,
    height: 2,
    offsetX: 0,
    offsetY: 0,
    rgba: Uint8ClampedArray.from(pixels.flat()),
  });

  const a = square([[10, 0, 0, 255], [20, 0, 0, 255], [30, 0, 0, 255], [40, 0, 0, 255]]);
  const b = square([[10, 0, 0, 255], [99, 0, 0, 255], [30, 0, 0, 255], [40, 0, 0, 255]]);

  const mask = createDifferenceMask(a, b);
  assert.deepEqual(
    Array.from(mask.rgba),
    [[0, 0, 0, 0], [255, 255, 255, 255], [0, 0, 0, 0], [0, 0, 0, 0]].flat(),
    "only the differing pixel is masked",
  );

  const masked = getMasked(a, mask);
  assert.deepEqual(Array.from(masked.rgba.subarray(4, 8)), [20, 0, 0, 255]);
  assert.equal(masked.rgba[3], 0, "unmasked pixels stay transparent");

  const alphaMask = makeAlphaMask(masked);
  assert.equal(alphaMask.rgba[4], 0, "alpha mask is black");
  assert.equal(alphaMask.rgba[7], 0, "single-pixel masks normalize to zero alpha");

  const stuck = stick(a, mask, 0, 0);
  assert.deepEqual(Array.from(stuck.rgba.subarray(4, 8)), [255, 255, 255, 255]);
  assert.deepEqual(Array.from(stuck.rgba.subarray(0, 4)), [10, 0, 0, 255]);
});
