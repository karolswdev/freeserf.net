// Generated, CI-safe DOS .PA archive containing decodable payloads: a palette,
// all 33 ground tiles, all 81+81 terrain masks, a tree, a flag, and shadows.
// This lets data-free tests exercise the real decode -> compose -> render path
// without any original game data. Colors are synthetic, not original art.

const headerByteLength = 10;
const entryCount = 4000;

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

function fixtureAnimationTable(): Uint8Array {
  // 200 big-endian offsets followed by 200 four-frame animations.
  const offsetsBytes = 200 * 4;
  const frameBytes = 200 * 4 * 3;
  const table = new Uint8Array(4 + offsetsBytes + frameBytes);
  const view = new DataView(table.buffer);
  view.setUint32(0, table.byteLength, false);
  for (let animation = 0; animation < 200; animation += 1) {
    view.setUint32(4 + animation * 4, offsetsBytes + animation * 12, false);
    for (let frame = 0; frame < 4; frame += 1) {
      const base = 4 + offsetsBytes + animation * 12 + frame * 3;
      table[base] = (animation + frame) & 0xff;
      view.setInt8(base + 1, frame - 2);
      view.setInt8(base + 2, -frame);
    }
  }

  return table;
}

export function createDecodableGeneratedPaArchive(): Uint8Array {
  const entries: FixtureEntry[] = [];

  // Palette 3 feeds every sprite decode; 3998 feeds the logo.
  entries.push({ index: 3, bytes: fixturePalette() });
  entries.push({ index: 3998, bytes: fixturePalette() });
  // The game logo (resource 41), 64x32 solid.
  entries.push({ index: 41, bytes: solidSprite(64, 32, 200) });

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

  // Serf animation table (entry 2): size check + 200 offsets + frames.
  entries.push({ index: 2, bytes: fixtureAnimationTable() });

  // Serf torso body 0 (2500) and its arms (1850), 16x16 transparent.
  entries.push({
    index: 2500,
    bytes: concatBytes([spriteHeader(16, 16, -8, -15), fullCoverageRuns(16 * 16, 64)]),
  });
  entries.push({
    index: 1850,
    bytes: concatBytes([spriteHeader(16, 16, -8, -15), fullCoverageRuns(16 * 16, 32)]),
  });

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

  // UI art: 44 font glyphs (750..793, 8x8 transparent), shadows (810..853),
  // 20 icons (870..889, 16x16 solid), 4 popup frame pieces (660..663),
  // 5 panel buttons (1750..1754, 32x32 solid), and the cursor (3999).
  for (let glyph = 0; glyph < 44; glyph += 1) {
    entries.push({
      index: 750 + glyph,
      bytes: concatBytes([spriteHeader(8, 8), fullCoverageRuns(8 * 8, 30 + glyph)]),
    });
    entries.push({
      index: 810 + glyph,
      bytes: concatBytes([spriteHeader(8, 8), fullCoverageRuns(8 * 8, 1)]),
    });
  }
  for (let icon = 0; icon < 64; icon += 1) {
    entries.push({ index: 870 + icon, bytes: solidSprite(16, 16, 120 + ((icon * 3) % 90)) });
  }
  // The popup background pattern icon (DiagonalGreen).
  entries.push({ index: 870 + 310, bytes: solidSprite(16, 16, 70) });
  // The reference frame_popup piece sizes (UI/Box.cs type 1): top 144x9,
  // bottom 144x7, left/right sides 8x144.
  entries.push({ index: 660, bytes: solidSprite(144, 9, 80) });
  entries.push({ index: 661, bytes: solidSprite(144, 7, 85) });
  entries.push({ index: 662, bytes: solidSprite(8, 144, 90) });
  entries.push({ index: 663, bytes: solidSprite(8, 144, 95) });
  for (let button = 0; button < 26; button += 1) {
    entries.push({ index: 1750 + button, bytes: solidSprite(32, 32, 160 + button * 3) });
  }
  for (let piece = 0; piece < 26; piece += 1) {
    entries.push({ index: 1780 + piece, bytes: solidSprite(8, 40, 90 + piece * 2) });
  }
  // Music: one synthetic XMI track at entry 3990 (FORM/XDIR + XMID with a
  // tempo meta, an instrument change, and two duration-carrying notes).
  entries.push({
    index: 3990,
    bytes: Uint8Array.from([
      70, 79, 82, 77, 0, 0, 0, 0, 88, 68, 73, 82, 73, 78, 70, 79, 2, 0, 0, 0,
      1, 0, 67, 65, 84, 32, 0, 0, 0, 0, 88, 77, 73, 68, 70, 79, 82, 77, 0, 0,
      0, 0, 88, 77, 73, 68, 84, 73, 77, 66, 2, 0, 0, 0, 0, 0, 69, 86, 78, 84,
      0, 0, 0, 0, 255, 81, 3, 7, 161, 32, 192, 5, 144, 60, 100, 48, 48, 144,
      64, 90, 24,
    ]),
  });

  // Sound effects: raw 8-bit PCM payloads at 3900 + id.
  for (const sfx of [1, 2, 4, 8, 34, 42, 76]) {
    const pcm = new Uint8Array(64);
    for (let i = 0; i < pcm.length; i += 1) {
      pcm[i] = (32 + sfx * 3 + i * 5) & 0xff;
    }
    entries.push({ index: 3900 + sfx, bytes: pcm });
  }

  entries.push({
    index: 3999,
    bytes: concatBytes([spriteHeader(16, 16), fullCoverageRuns(16 * 16, 250)]),
  });

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
