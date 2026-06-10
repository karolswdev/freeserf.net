import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DosSpriteDecodeError,
  buildSpriteAtlas,
  composeMaskedTile,
  terrainGroundSpriteIndex,
  tileMaskDown,
  tileMaskUp,
  tileTerrainSprites,
  triangleMaskCodeDown,
  triangleMaskCodeUp,
} from "@serfbound/assets";

function rgbaSprite({ width, height, offsetX = 0, offsetY = 0, pixels }) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  pixels.forEach((pixel, index) => {
    rgba.set(pixel, index * 4);
  });
  return { deltaX: 0, deltaY: 0, width, height, offsetX, offsetY, rgba };
}

test("mask tables match the reference renderer arrays", () => {
  assert.equal(tileMaskUp.length, 81);
  assert.equal(tileMaskDown.length, 81);
  assert.equal(tileTerrainSprites.length, 128);

  // Spot checks against Freeserf.Core/Render/RenderMap.cs.
  assert.equal(tileMaskUp[40], 4); // flat triangle
  assert.equal(tileMaskUp[0], 0);
  assert.equal(tileMaskUp[80], 7);
  assert.equal(tileMaskUp[5], -1);
  assert.equal(tileMaskDown[40], 4);
  assert.equal(tileMaskDown[18], 3);
  assert.equal(tileMaskDown[44], 0);
  assert.equal(tileMaskDown[45], -1);

  assert.equal(tileMaskUp.filter((value) => value >= 0).length, 61);
  assert.equal(tileMaskDown.filter((value) => value >= 0).length, 61);

  // Water always renders ground sprite 32; grass starts the 0-7 block.
  assert.equal(tileTerrainSprites[0], 32);
  assert.equal(tileTerrainSprites[4 * 8], 0);
  assert.equal(tileTerrainSprites[4 * 8 + 7], 7);
  assert.equal(tileTerrainSprites[8 * 8], 24);
  assert.equal(tileTerrainSprites[14 * 8], 16);
});

test("triangle mask codes follow the reference slope formula", () => {
  assert.equal(triangleMaskCodeUp(0, 0, 0), 40);
  assert.equal(triangleMaskCodeUp(2, 1, 1), 4 + 1 + 9 * (4 + 1));
  assert.equal(triangleMaskCodeDown(1, 2, 0), 4 + 1 + 9 * (4 - 1));
  assert.equal(triangleMaskCodeUp(5, 0, 0), null); // |delta| > 4
  assert.equal(triangleMaskCodeUp(4, 8, 0), null); // table -1 slot
  assert.equal(terrainGroundSpriteIndex(0, 40, "up"), 32);
  assert.equal(terrainGroundSpriteIndex(5, 40, "up"), 4);
  assert.equal(terrainGroundSpriteIndex(5, 0, "down"), 0);
  assert.throws(() => terrainGroundSpriteIndex(5, 5, "up"), DosSpriteDecodeError);
});

test("masked tiles sample the ground with vertical repetition and mask gating", () => {
  const ground = rgbaSprite({
    width: 2,
    height: 2,
    pixels: [
      [10, 0, 0, 255],
      [20, 0, 0, 255],
      [30, 0, 0, 255],
      [40, 0, 0, 255],
    ],
  });
  const mask = rgbaSprite({
    width: 2,
    height: 3,
    offsetY: -2,
    pixels: [
      [255, 255, 255, 255],
      [0, 0, 0, 0],
      [255, 255, 255, 255],
      [255, 255, 255, 255],
      [255, 255, 255, 255],
      [0, 0, 0, 0],
    ],
  });

  const composed = composeMaskedTile(ground, mask);
  assert.equal(composed.width, 2);
  assert.equal(composed.height, 3);
  assert.equal(composed.offsetY, -2);
  assert.deepEqual(
    Array.from(composed.rgba),
    [
      [10, 0, 0, 255],
      [0, 0, 0, 0],
      [30, 0, 0, 255],
      [40, 0, 0, 255],
      [10, 0, 0, 255], // row 2 repeats ground row 0
      [0, 0, 0, 0],
    ].flat(),
  );
});

test("the sprite atlas packs without overlap and round-trips pixels and offsets", () => {
  const sprites = {
    tall: rgbaSprite({
      width: 2,
      height: 3,
      offsetX: -1,
      offsetY: -2,
      pixels: Array.from({ length: 6 }, (_, index) => [index + 1, 0, 0, 255]),
    }),
    wide: rgbaSprite({
      width: 3,
      height: 1,
      pixels: [
        [101, 0, 0, 255],
        [102, 0, 0, 255],
        [103, 0, 0, 255],
      ],
    }),
    dot: rgbaSprite({ width: 1, height: 1, pixels: [[201, 0, 0, 255]] }),
  };

  const atlas = buildSpriteAtlas(sprites, 8);
  assert.equal(atlas.width, 8);
  assert.equal(atlas.rgba.length, atlas.width * atlas.height * 4);

  const coverage = new Set();
  for (const [key, sprite] of Object.entries(sprites)) {
    const region = atlas.regions[key];
    assert.notEqual(region, undefined, `${key} has a region`);
    assert.equal(region.width, sprite.width);
    assert.equal(region.height, sprite.height);
    assert.equal(region.offsetX, sprite.offsetX);
    assert.equal(region.offsetY, sprite.offsetY);

    for (let y = 0; y < region.height; y += 1) {
      for (let x = 0; x < region.width; x += 1) {
        const cell = `${region.x + x},${region.y + y}`;
        assert.equal(coverage.has(cell), false, `no overlap at ${cell}`);
        coverage.add(cell);

        const atlasOffset = ((region.y + y) * atlas.width + region.x + x) * 4;
        const spriteOffset = (y * sprite.width + x) * 4;
        assert.deepEqual(
          Array.from(atlas.rgba.subarray(atlasOffset, atlasOffset + 4)),
          Array.from(sprite.rgba.subarray(spriteOffset, spriteOffset + 4)),
          `${key} pixel (${x},${y}) round-trips`,
        );
      }
    }
  }

  assert.throws(
    () => buildSpriteAtlas({ huge: rgbaSprite({ width: 9, height: 1, pixels: [] }) }, 8),
    DosSpriteDecodeError,
  );
});
