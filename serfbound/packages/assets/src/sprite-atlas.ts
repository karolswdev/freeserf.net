import { DosSpriteDecodeError, type DecodedDosSprite } from "./dos-sprites.js";

export type SpriteAtlasRegion = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

export type SpriteAtlas = {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
  readonly regions: Readonly<Record<string, SpriteAtlasRegion>>;
};

const atlasPadding = 1;
const defaultAtlasWidth = 512;

// Shelf packer: sprites sorted by height fill left-to-right rows. Simple, but
// terrain triangles and object sprites are all small and similar-sized, so the
// waste stays low and the packing stays deterministic.
export function buildSpriteAtlas(
  sprites: Readonly<Record<string, DecodedDosSprite>>,
  atlasWidth = defaultAtlasWidth,
): SpriteAtlas {
  const entries = Object.entries(sprites);
  for (const [key, sprite] of entries) {
    if (sprite.width + 2 * atlasPadding > atlasWidth) {
      throw new DosSpriteDecodeError(
        `Sprite '${key}' (${sprite.width}px) is wider than the ${atlasWidth}px atlas.`,
      );
    }
  }

  const ordered = [...entries].sort(([leftKey, left], [rightKey, right]) => {
    if (left.height !== right.height) {
      return right.height - left.height;
    }

    return leftKey < rightKey ? -1 : 1;
  });

  const regions: Record<string, SpriteAtlasRegion> = {};
  let shelfX = atlasPadding;
  let shelfY = atlasPadding;
  let shelfHeight = 0;

  for (const [key, sprite] of ordered) {
    if (shelfX + sprite.width + atlasPadding > atlasWidth) {
      shelfX = atlasPadding;
      shelfY += shelfHeight + atlasPadding;
      shelfHeight = 0;
    }

    regions[key] = {
      x: shelfX,
      y: shelfY,
      width: sprite.width,
      height: sprite.height,
      deltaX: sprite.deltaX,
      deltaY: sprite.deltaY,
      offsetX: sprite.offsetX,
      offsetY: sprite.offsetY,
    };
    shelfX += sprite.width + atlasPadding;
    shelfHeight = Math.max(shelfHeight, sprite.height);
  }

  const atlasHeight = Math.max(1, shelfY + shelfHeight + atlasPadding);
  const rgba = new Uint8ClampedArray(atlasWidth * atlasHeight * 4);

  for (const [key, sprite] of entries) {
    const region = regions[key];
    if (region === undefined) {
      continue;
    }

    for (let y = 0; y < sprite.height; y += 1) {
      const sourceOffset = y * sprite.width * 4;
      const targetOffset = ((region.y + y) * atlasWidth + region.x) * 4;
      rgba.set(sprite.rgba.subarray(sourceOffset, sourceOffset + sprite.width * 4), targetOffset);
    }
  }

  return { width: atlasWidth, height: atlasHeight, rgba, regions };
}
