import { DosSpriteDecodeError, type DecodedDosSprite } from "./dos-sprites.js";

// Reference tables transcribed from Freeserf.Core/Render/RenderMap.cs.
// A triangle's mask code is (4 + Δleft) + 9 * (4 + Δright) where the deltas
// compare the triangle apex height against its two base vertex heights.
// The table value selects one of eight ground sprite variants; -1 marks a
// slope combination the original game never renders.

export const tileMaskUp: readonly number[] = [
  0, 1, 3, 6, 7, -1, -1, -1, -1,
  0, 1, 2, 5, 6, 7, -1, -1, -1,
  0, 1, 2, 3, 5, 6, 7, -1, -1,
  0, 1, 2, 3, 4, 5, 6, 7, -1,
  0, 1, 2, 3, 4, 4, 5, 6, 7,
  -1, 0, 1, 2, 3, 4, 5, 6, 7,
  -1, -1, 0, 1, 2, 4, 5, 6, 7,
  -1, -1, -1, 0, 1, 2, 5, 6, 7,
  -1, -1, -1, -1, 0, 1, 4, 6, 7,
];

export const tileMaskDown: readonly number[] = [
  0, 0, 0, 0, 0, -1, -1, -1, -1,
  1, 1, 1, 1, 1, 0, -1, -1, -1,
  3, 2, 2, 2, 2, 1, 0, -1, -1,
  6, 5, 3, 3, 3, 2, 1, 0, -1,
  7, 6, 5, 4, 4, 3, 2, 1, 0,
  -1, 7, 6, 5, 4, 4, 4, 2, 1,
  -1, -1, 7, 6, 5, 5, 5, 5, 4,
  -1, -1, -1, 7, 6, 6, 6, 6, 6,
  -1, -1, -1, -1, 7, 7, 7, 7, 7,
];

// Ground sprite index per (terrain type * 8 + mask variant).
// Terrain types: 0-3 water, 4-7 grass, 8-10 desert, 11-13 tundra, 14-15 snow.
export const tileTerrainSprites: readonly number[] = [
  32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32,
  32, 32, 32, 32, 32, 32, 32, 32,
  0, 1, 2, 3, 4, 5, 6, 7,
  0, 1, 2, 3, 4, 5, 6, 7,
  0, 1, 2, 3, 4, 5, 6, 7,
  0, 1, 2, 3, 4, 5, 6, 7,
  24, 25, 26, 27, 28, 29, 30, 31,
  24, 25, 26, 27, 28, 29, 30, 31,
  24, 25, 26, 27, 28, 29, 30, 31,
  8, 9, 10, 11, 12, 13, 14, 15,
  8, 9, 10, 11, 12, 13, 14, 15,
  8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23,
  16, 17, 18, 19, 20, 21, 22, 23,
];

export const tileWidth = 32;
export const tileHeight = 20;
export const tileRenderMaxHeight = 41;
export const terrainTypeCount = 16;

export function triangleMaskCodeUp(
  apexHeight: number,
  leftHeight: number,
  rightHeight: number,
): number | null {
  return triangleMaskCode(apexHeight - leftHeight, apexHeight - rightHeight, tileMaskUp);
}

export function triangleMaskCodeDown(
  apexHeight: number,
  leftHeight: number,
  rightHeight: number,
): number | null {
  return triangleMaskCode(leftHeight - apexHeight, rightHeight - apexHeight, tileMaskDown);
}

function triangleMaskCode(
  leftDelta: number,
  rightDelta: number,
  table: readonly number[],
): number | null {
  if (leftDelta < -4 || leftDelta > 4 || rightDelta < -4 || rightDelta > 4) {
    return null;
  }

  const maskCode = 4 + leftDelta + 9 * (4 + rightDelta);
  return (table[maskCode] ?? -1) < 0 ? null : maskCode;
}

export function terrainGroundSpriteIndex(
  terrainType: number,
  maskCode: number,
  orientation: "up" | "down",
): number {
  const table = orientation === "up" ? tileMaskUp : tileMaskDown;
  const variant = table[maskCode] ?? -1;
  if (terrainType < 0 || terrainType >= terrainTypeCount || variant < 0) {
    throw new DosSpriteDecodeError(
      `No ground sprite for terrain ${terrainType} mask code ${maskCode} (${orientation}).`,
    );
  }

  return tileTerrainSprites[terrainType * 8 + variant] ?? 32;
}

// The reference atlas repeats each 32x20 ground tile vertically to the 41px
// max mask height before masking (TextureAtlasManager.AddAll), so masks taller
// than one tile keep sampling ground texture.
export function composeMaskedTile(
  ground: DecodedDosSprite,
  mask: DecodedDosSprite,
): DecodedDosSprite {
  if (ground.width <= 0 || ground.height <= 0) {
    throw new DosSpriteDecodeError("Cannot compose a masked tile from an empty ground sprite.");
  }

  const rgba = new Uint8ClampedArray(mask.width * mask.height * 4);

  for (let y = 0; y < mask.height; y += 1) {
    const groundRow = y % ground.height;
    for (let x = 0; x < mask.width; x += 1) {
      const maskOffset = (y * mask.width + x) * 4;
      if ((mask.rgba[maskOffset + 3] ?? 0) === 0) {
        continue;
      }

      const groundOffset = (groundRow * ground.width + (x % ground.width)) * 4;
      rgba[maskOffset] = ground.rgba[groundOffset] ?? 0;
      rgba[maskOffset + 1] = ground.rgba[groundOffset + 1] ?? 0;
      rgba[maskOffset + 2] = ground.rgba[groundOffset + 2] ?? 0;
      rgba[maskOffset + 3] = 0xff;
    }
  }

  return {
    deltaX: mask.deltaX,
    deltaY: mask.deltaY,
    width: mask.width,
    height: mask.height,
    offsetX: mask.offsetX,
    offsetY: mask.offsetY,
    rgba,
  };
}
