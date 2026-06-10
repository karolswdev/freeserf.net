// Generated, CI-safe DOS .PA archive containing decodable payloads: a palette,
// all 33 ground tiles, all 81+81 terrain masks, a tree, a flag, and shadows.
// This lets data-free tests exercise the real decode -> compose -> render path
// without any original game data. Colors are synthetic, not original art.

const headerByteLength = 10;
const entryCount = 1700;

type FixtureEntry = {
  readonly index: number;
  readonly bytes: Uint8Array;
};

function spriteHeader(
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
): Uint8Array {
  const bytes = new Uint8Array(headerByteLength);
  const view = new DataView(bytes.buffer);
  view.setInt8(0, 0);
  view.setInt8(1, 0);
  view.setUint16(2, width, true);
  view.setUint16(4, height, true);
  view.setInt16(6, offsetX, true);
  view.setInt16(8, offsetY, true);
  return bytes;
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const bytes = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    bytes.set(part, cursor);
    cursor += part.length;
  }

  return bytes;
}

// Full-coverage run-length stream: "drop 0, fill chunk" pairs. Mask and
// overlay fills consume no payload bytes; transparent fills consume one
// palette index byte per pixel.
function fullCoverageRuns(pixelCount: number, paletteIndex: number | null): Uint8Array {
  const parts: number[] = [];
  let remaining = pixelCount;
  while (remaining > 0) {
    const chunk = Math.min(remaining, 255);
    parts.push(0, chunk);
    if (paletteIndex !== null) {
      for (let i = 0; i < chunk; i += 1) {
        parts.push(paletteIndex);
      }
    }

    remaining -= chunk;
  }

  return Uint8Array.from(parts);
}

function fixturePalette(): Uint8Array {
  const palette = new Uint8Array(768);
  for (let index = 0; index < 256; index += 1) {
    palette[index * 3] = (index * 5) & 0xff;
    palette[index * 3 + 1] = (96 + index * 3) & 0xff;
    palette[index * 3 + 2] = (40 + index * 7) & 0xff;
  }

  return palette;
}

function solidSprite(width: number, height: number, paletteIndex: number): Uint8Array {
  const body = new Uint8Array(width * height).fill(paletteIndex & 0xff);
  return concatBytes([spriteHeader(width, height), body]);
}

export function createDecodableGeneratedPaArchive(): Uint8Array {
  const entries: FixtureEntry[] = [];

  // Palette 3 feeds every sprite decode.
  entries.push({ index: 3, bytes: fixturePalette() });

  // 33 ground tiles (archive 260..292), each a distinct solid color.
  for (let ground = 0; ground < 33; ground += 1) {
    entries.push({ index: 260 + ground, bytes: solidSprite(32, 20, 16 + ground * 6) });
  }

  // 81 up masks (60..140) anchored at (0,0) and 81 down masks (141..221)
  // anchored one tile up, mirroring the real mask header conventions.
  for (let mask = 0; mask < 81; mask += 1) {
    entries.push({
      index: 60 + mask,
      bytes: concatBytes([spriteHeader(32, 20), fullCoverageRuns(32 * 20, null)]),
    });
    entries.push({
      index: 141 + mask,
      bytes: concatBytes([spriteHeader(32, 20, 0, -19), fullCoverageRuns(32 * 20, null)]),
    });
  }

  // Tree (map_object 0 -> entry 1250) with its overlay shadow (1500).
  entries.push({
    index: 1250,
    bytes: concatBytes([spriteHeader(32, 30, -16, -29), fullCoverageRuns(32 * 30, 200)]),
  });
  entries.push({
    index: 1500,
    bytes: concatBytes([spriteHeader(32, 10, -16, -4), fullCoverageRuns(32 * 10, null)]),
  });

  // 27 path masks (230..256) and 10 path grounds (300..309) for roads.
  for (let mask = 0; mask < 27; mask += 1) {
    entries.push({
      index: 230 + mask,
      bytes: concatBytes([spriteHeader(32, 20), fullCoverageRuns(32 * 20, null)]),
    });
  }
  for (let ground = 0; ground < 10; ground += 1) {
    entries.push({ index: 300 + ground, bytes: solidSprite(32, 20, 100 + ground * 4) });
  }

  // 16 water wave sprites (map_waves -> entries 630..645), 48x19 transparent.
  for (let wave = 0; wave < 16; wave += 1) {
    entries.push({
      index: 630 + wave,
      bytes: concatBytes([spriteHeader(48, 19), fullCoverageRuns(48 * 19, 220 + wave)]),
    });
  }

  // Building sprites (map_object 0x98..0xc0 -> entries 1402..1442) with
  // shadows, plus 10 territory border sprites (map_border 610..619).
  for (let sprite = 0x98; sprite <= 0xc0; sprite += 1) {
    entries.push({
      index: 1250 + sprite,
      bytes: concatBytes([spriteHeader(48, 40, -24, -39), fullCoverageRuns(48 * 40, 60 + sprite)]),
    });
    entries.push({
      index: 1500 + sprite,
      bytes: concatBytes([spriteHeader(48, 12, -24, -5), fullCoverageRuns(48 * 12, null)]),
    });
  }
  for (let border = 0; border < 10; border += 1) {
    entries.push({
      index: 610 + border,
      bytes: concatBytes([spriteHeader(8, 8, -4, -4), fullCoverageRuns(8 * 8, 240 + border)]),
    });
  }

  // Flag frame 0 (map_object 128 -> entry 1378) with its shadow (1628).
  entries.push({
    index: 1378,
    bytes: concatBytes([spriteHeader(16, 19, 0, -18), fullCoverageRuns(16 * 19, 210)]),
  });
  entries.push({
    index: 1628,
    bytes: concatBytes([spriteHeader(16, 8, -8, -2), fullCoverageRuns(16 * 8, null)]),
  });

  const tableStart = 8;
  const tableEnd = tableStart + entryCount * 8;
  let cursor = tableEnd;
  const placements = entries.map((entry) => {
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
