import {
  DosSpriteDecodeError,
  decodeDosTransparentSprite,
  type DecodedDosSprite,
  type DosPaArchive,
} from "./dos-sprites.js";

// Serf animation table and player-color sprite compositing, ported from
// Freeserf.Core/Data/DataSourceLegacy.cs (LoadAnimationTable) and
// DataSource.cs (SeparateSprites, CreateMask, GetMasked, MakeAlphaMask,
// Stick). The DOS serf arms live at archive entry 1850 + body index.

const animationTableArchiveIndex = 2;
const serfArmsArchiveIndex = 1850;
const serfTorsoArchiveIndex = 2500;

export type SerfAnimationFrame = {
  readonly sprite: number;
  readonly x: number;
  readonly y: number;
};

export type SerfAnimationTable = readonly (readonly SerfAnimationFrame[])[];

export function parseSerfAnimationTable(archive: DosPaArchive): SerfAnimationTable {
  const data = archive.getEntryBytes(animationTableArchiveIndex);
  if (data === null) {
    throw new DosSpriteDecodeError("The serf animation table entry is missing.");
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // The first big-endian uint32 is the byte length of the rest of the table.
  if (view.getUint32(0, false) !== data.byteLength) {
    throw new DosSpriteDecodeError("The serf animation table failed its size check.");
  }

  const table = data.subarray(4);
  const tableView = new DataView(table.buffer, table.byteOffset, table.byteLength);

  const offsets: number[] = [];
  for (let index = 0; index < 200; index += 1) {
    offsets.push(tableView.getUint32(index * 4, false));
  }

  const animations: SerfAnimationFrame[][] = [];
  for (let index = 0; index < 200; index += 1) {
    const offset = offsets[index]!;
    let next = table.byteLength;
    for (const candidate of offsets) {
      if (candidate > offset) {
        next = Math.min(next, candidate);
      }
    }

    const frameCount = Math.trunc((next - offset) / 3);
    const frames: SerfAnimationFrame[] = [];
    for (let frame = 0; frame < frameCount; frame += 1) {
      const base = offset + frame * 3;
      frames.push({
        sprite: table[base]!,
        x: (table[base + 1]! << 24) >> 24,
        y: (table[base + 2]! << 24) >> 24,
      });
    }

    animations.push(frames);
  }

  return animations;
}

// Sprite.CreateMask: opaque white where the two sprites differ.
export function createDifferenceMask(
  first: DecodedDosSprite,
  second: DecodedDosSprite,
): DecodedDosSprite | null {
  if (first.width !== second.width || first.height !== second.height) {
    return null;
  }

  const rgba = new Uint8ClampedArray(first.rgba.length);
  for (let pixel = 0; pixel < first.rgba.length; pixel += 4) {
    const differs =
      first.rgba[pixel] !== second.rgba[pixel] ||
      first.rgba[pixel + 1] !== second.rgba[pixel + 1] ||
      first.rgba[pixel + 2] !== second.rgba[pixel + 2] ||
      first.rgba[pixel + 3] !== second.rgba[pixel + 3];
    if (differs) {
      rgba[pixel] = 0xff;
      rgba[pixel + 1] = 0xff;
      rgba[pixel + 2] = 0xff;
      rgba[pixel + 3] = 0xff;
    }
  }

  return { ...first, rgba };
}

// Sprite.GetMasked for equal-size sprites (the serf torso path always
// compares same-payload decodes): the sprite's pixels where the mask is
// opaque.
export function getMasked(sprite: DecodedDosSprite, mask: DecodedDosSprite): DecodedDosSprite {
  const rgba = new Uint8ClampedArray(mask.width * mask.height * 4);
  for (let pixel = 0; pixel < rgba.length; pixel += 4) {
    if (mask.rgba[pixel + 3] !== 0) {
      rgba[pixel] = sprite.rgba[pixel]!;
      rgba[pixel + 1] = sprite.rgba[pixel + 1]!;
      rgba[pixel + 2] = sprite.rgba[pixel + 2]!;
      rgba[pixel + 3] = sprite.rgba[pixel + 3]!;
    }
  }

  return { ...mask, rgba };
}

// Sprite.MakeAlphaMask: luminance becomes inverted alpha, color goes black,
// then the minimum alpha is subtracted (reference normalization).
export function makeAlphaMask(sprite: DecodedDosSprite): DecodedDosSprite {
  const rgba = Uint8ClampedArray.from(sprite.rgba);
  let minAlpha = 0xff;
  for (let pixel = 0; pixel < rgba.length; pixel += 4) {
    if (rgba[pixel + 3] !== 0) {
      const alpha =
        0xff -
        Math.trunc(0.21 * rgba[pixel]! + 0.72 * rgba[pixel + 1]! + 0.07 * rgba[pixel + 2]!);
      rgba[pixel] = 0;
      rgba[pixel + 1] = 0;
      rgba[pixel + 2] = 0;
      rgba[pixel + 3] = alpha;
      minAlpha = Math.min(minAlpha, alpha);
    }
  }

  for (let pixel = 0; pixel < rgba.length; pixel += 4) {
    if (rgba[pixel + 3] !== 0) {
      rgba[pixel + 3] = rgba[pixel + 3]! - minAlpha;
    }
  }

  return { ...sprite, rgba };
}

// Sprite.Stick: alpha-blend the sticker onto the base in place.
export function stick(
  base: DecodedDosSprite,
  sticker: DecodedDosSprite,
  dx: number,
  dy: number,
): DecodedDosSprite {
  const rgba = Uint8ClampedArray.from(base.rgba);
  const width = Math.min(base.width, sticker.width);
  const height = Math.min(base.height, sticker.height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const stickerOffset = (y * sticker.width + x) * 4;
      const alpha = sticker.rgba[stickerOffset + 3]!;
      if (alpha === 0) {
        continue;
      }

      const baseOffset = ((y + dy) * base.width + (x + dx)) * 4;
      if (baseOffset + 3 >= rgba.length) {
        continue;
      }

      const blend = alpha / 255;
      rgba[baseOffset] = Math.round(rgba[baseOffset]! * (1 - blend) + sticker.rgba[stickerOffset]! * blend);
      rgba[baseOffset + 1] = Math.round(
        rgba[baseOffset + 1]! * (1 - blend) + sticker.rgba[stickerOffset + 1]! * blend,
      );
      rgba[baseOffset + 2] = Math.round(
        rgba[baseOffset + 2]! * (1 - blend) + sticker.rgba[stickerOffset + 2]! * blend,
      );
      rgba[baseOffset + 3] = Math.max(rgba[baseOffset + 3]!, alpha);
    }
  }

  return { ...base, rgba };
}

export type ComposedSerfTorso = {
  // The display sprite (torso with shading and arms applied).
  readonly sprite: DecodedDosSprite;
  // Opaque-white mask of the player-color region (tinted at render time).
  readonly playerMask: DecodedDosSprite;
};

// DataSourceDos.GetSpriteParts for SerfTorso: torso at palette offset 64,
// the same payload at offset 72, the difference is the player-color region;
// the shaded region sticks back onto the torso and the arms stick on top.
export function composeSerfTorso(
  archive: DosPaArchive,
  bodyIndex: number,
): ComposedSerfTorso | null {
  const palette = archive.getPalette(3);
  const torsoData = archive.getEntryBytes(serfTorsoArchiveIndex + bodyIndex);
  const armsData = archive.getEntryBytes(serfArmsArchiveIndex + bodyIndex);
  if (palette === null || torsoData === null || armsData === null) {
    return null;
  }

  let torso = decodeDosTransparentSprite(torsoData, palette, 64);
  const torsoVariant = decodeDosTransparentSprite(torsoData, palette, 72);

  const playerMask = createDifferenceMask(torso, torsoVariant);
  if (playerMask === null) {
    return null;
  }

  const shading = makeAlphaMask(getMasked(torso, playerMask));
  torso = stick(torso, shading, 0, 0);

  const arms = decodeDosTransparentSprite(armsData, palette);
  torso = stick(torso, arms, 0, 0);

  return { sprite: torso, playerMask };
}
