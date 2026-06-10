import {
  decodeDosSolidSprite,
  decodeDosTransparentSprite,
  type DecodedDosSprite,
  type DosPaArchive,
} from "./dos-sprites.js";

// UI art decoding from the DOS archive, per the DataSourceDos resource
// table: fonts and the cursor are transparent sprites, icons, frames, and
// panel buttons are solid sprites, all against palette 3.

export const uiResourceBase = {
  frameTop: 600,
  framePopup: 660,
  indicator: 670,
  font: 750,
  fontShadow: 810,
  icon: 870,
  panelButton: 1750,
  frameBottom: 1780,
  frameSplit: 3880,
  cursor: 3999,
} as const;

export const uiFontGlyphCount = 44;

// TextRenderer.MapCharacterToSpriteIndex, exact port: invalid characters
// print as '?'.
export function mapCharacterToGlyphIndex(character: string): number {
  const code = character.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 65; // A-Z
  }

  if (code >= 97 && code <= 122) {
    return code - 97; // a-z
  }

  if (code === 0xc4 || code === 0xe4) {
    return 26; // Ä ä
  }

  if (code === 0xd6 || code === 0xf6) {
    return 27; // Ö ö
  }

  if (code === 0xdc || code === 0xfc) {
    return 28; // Ü ü
  }

  if (code >= 48 && code <= 57) {
    return 29 + (code - 48); // 0-9
  }

  if (character === ".") return 39;
  if (character === "-") return 40;
  if (character === ":") return 41;
  if (character === "?") return 42;
  if (character === "%") return 43;

  return 42;
}

export type UiTextGlyphPlacement = {
  readonly glyphIndex: number;
  readonly x: number;
};

// The legacy DOS font lays out on a fixed 8-pixel advance; spaces advance
// without emitting a glyph.
export const uiFontAdvance = 8;

export function layoutUiText(text: string): UiTextGlyphPlacement[] {
  const placements: UiTextGlyphPlacement[] = [];
  let x = 0;
  for (const character of text) {
    if (character !== " ") {
      placements.push({ glyphIndex: mapCharacterToGlyphIndex(character), x });
    }

    x += uiFontAdvance;
  }

  return placements;
}

function uiPalette(archive: DosPaArchive) {
  return archive.getPalette(3);
}

export function decodeUiFontGlyph(
  archive: DosPaArchive,
  glyphIndex: number,
): DecodedDosSprite | null {
  const palette = uiPalette(archive);
  const data = archive.getEntryBytes(uiResourceBase.font + glyphIndex);
  if (palette === null || data === null) {
    return null;
  }

  return decodeDosTransparentSprite(data, palette);
}

// Replace every visible pixel's color, keeping coverage/alpha — the
// reference tints whole glyph sets this way (TextureAtlasManager:
// font #73b343, font shadow black).
export function tintDecodedSprite(
  sprite: DecodedDosSprite,
  red: number,
  green: number,
  blue: number,
): DecodedDosSprite {
  const rgba = new Uint8ClampedArray(sprite.rgba);
  for (let pixel = 0; pixel < rgba.length; pixel += 4) {
    if (rgba[pixel + 3]! !== 0) {
      rgba[pixel] = red;
      rgba[pixel + 1] = green;
      rgba[pixel + 2] = blue;
    }
  }

  return { ...sprite, rgba };
}

// The font-shadow glyph set (one dark outline per font glyph, same
// index mapping), tinted black like the reference so text stays
// readable over any terrain.
export function decodeUiFontShadowGlyph(
  archive: DosPaArchive,
  glyphIndex: number,
): DecodedDosSprite | null {
  const palette = uiPalette(archive);
  const data = archive.getEntryBytes(uiResourceBase.fontShadow + glyphIndex);
  if (palette === null || data === null) {
    return null;
  }

  return tintDecodedSprite(decodeDosTransparentSprite(data, palette), 0, 0, 0);
}

export function decodeUiIcon(archive: DosPaArchive, index: number): DecodedDosSprite | null {
  const palette = uiPalette(archive);
  const data = archive.getEntryBytes(uiResourceBase.icon + index);
  if (palette === null || data === null) {
    return null;
  }

  return decodeDosSolidSprite(data, palette);
}

export function decodeUiPanelButton(
  archive: DosPaArchive,
  index: number,
): DecodedDosSprite | null {
  const palette = uiPalette(archive);
  const data = archive.getEntryBytes(uiResourceBase.panelButton + index);
  if (palette === null || data === null) {
    return null;
  }

  return decodeDosSolidSprite(data, palette);
}

export type UiFrameKind = "frameTop" | "framePopup" | "frameBottom" | "frameSplit";

export function decodeUiFrame(
  archive: DosPaArchive,
  kind: UiFrameKind,
  index: number,
): DecodedDosSprite | null {
  const palette = uiPalette(archive);
  const data = archive.getEntryBytes(uiResourceBase[kind] + index);
  if (palette === null || data === null) {
    return null;
  }

  return decodeDosSolidSprite(data, palette);
}

export function decodeUiCursor(archive: DosPaArchive): DecodedDosSprite | null {
  const palette = uiPalette(archive);
  const data = archive.getEntryBytes(uiResourceBase.cursor);
  if (palette === null || data === null) {
    return null;
  }

  return decodeDosTransparentSprite(data, palette);
}

// The game logo (resource 41) decodes against palette 3998.
export function decodeUiLogo(archive: DosPaArchive): DecodedDosSprite | null {
  const palette = archive.getPalette(3998);
  const data = archive.getEntryBytes(41);
  if (palette === null || data === null) {
    return null;
  }

  return decodeDosSolidSprite(data, palette);
}
