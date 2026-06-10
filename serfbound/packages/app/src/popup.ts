import type { RenderSize } from "@serfbound/engine";

// The popup system, ported from Freeserf.Core/UI/PopupBox.cs as
// browser-native logic: the reference 144x160 box, the build-menu pages
// with their exact building positions, and the resources box layout.

export type PopupKind = "buildBasic" | "buildAdv1" | "buildAdv2" | "stats" | "sett" | "map";

export const popupWidth = 144;
export const popupHeight = 160;

export type PopupRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

// UI/Box.cs Border definitions, type 1 (PopupBox/NotificationBox):
// frame_popup sprite 0 is the 144x9 top bar, sprite 1 the 144x7 bottom
// bar, sprites 2/3 the 8x144 left/right sides. Horizontal bars span the
// full box width; the sides run between them.
export const popupBorderSize = { left: 8, right: 8, top: 9, bottom: 7 } as const;

export type PopupBorderPiece = {
  // frame_popup sprite index.
  readonly sprite: number;
  readonly x: number;
  readonly y: number;
  // Piece height in box pixels; vertical pieces crop the 144-tall side
  // sprite when the box is shorter than the reference 160.
  readonly height: number;
};

export function popupBorderLayout(width: number, height: number): readonly PopupBorderPiece[] {
  const sideHeight = height - popupBorderSize.top - popupBorderSize.bottom;
  return [
    { sprite: 0, x: 0, y: 0, height: popupBorderSize.top },
    { sprite: 2, x: 0, y: popupBorderSize.top, height: sideHeight },
    { sprite: 3, x: width - popupBorderSize.right, y: popupBorderSize.top, height: sideHeight },
    { sprite: 1, x: 0, y: height - popupBorderSize.bottom, height: popupBorderSize.bottom },
  ];
}

// The interior between the borders: the reference 128x144 content area
// the background pattern tiles (content layouts below are box-space,
// insets already applied, matching the reference draw helpers).
export const popupInterior = { x: 8, y: 9, width: 128, height: 144 } as const;

// Popups float above the map, centered horizontally, upper third like the
// original interface layout.
export function popupRect(canvas: RenderSize, scale: number): PopupRect {
  const width = popupWidth * scale;
  const height = popupHeight * scale;
  return {
    x: Math.max(0, Math.floor((canvas.width - width) / 2)),
    y: Math.max(0, Math.floor((canvas.height - height) / 3)),
    width,
    height,
  };
}

export function pointInPopup(rect: PopupRect, pointX: number, pointY: number): boolean {
  return (
    pointX >= rect.x &&
    pointX < rect.x + rect.width &&
    pointY >= rect.y &&
    pointY < rect.y + rect.height
  );
}

export type BuildPopupItem = {
  // Engine building type value, or "flag".
  readonly building: number | "flag";
  readonly x: number;
  readonly y: number;
};

// DrawBasicBuildingBox / DrawAdv1BuildingBox / DrawAdv2BuildingBox
// positions, exactly as the reference lays them out (military entries
// included; the engine rejects invalid sites).
export const buildPopupPages: Readonly<Record<string, readonly BuildPopupItem[]>> = {
  buildBasic: [
    { building: 11, x: 88, y: 22 }, // hut
    { building: 4, x: 24, y: 22 }, // stonecutter
    { building: 2, x: 8, y: 67 }, // lumberjack
    { building: 9, x: 56, y: 65 }, // forester
    { building: 1, x: 104, y: 64 }, // fisher
    { building: 15, x: 24, y: 94 }, // mill
    { building: 3, x: 88, y: 96 }, // boatbuilder
    { building: "flag", x: 72, y: 117 },
  ],
  buildAdv1: [
    { building: 13, x: 8, y: 24 }, // butcher
    { building: 20, x: 72, y: 24 }, // weaponsmith
    { building: 18, x: 8, y: 59 }, // steel smelter
    { building: 17, x: 72, y: 59 }, // sawmill
    { building: 16, x: 24, y: 109 }, // baker
    { building: 23, x: 88, y: 105 }, // gold smelter
  ],
  buildAdv2: [
    { building: 21, x: 24, y: 108 }, // tower
    { building: 22, x: 72, y: 93 }, // fortress
    { building: 19, x: 8, y: 10 }, // toolmaker
    { building: 10, x: 8, y: 55 }, // stock
    { building: 12, x: 72, y: 10 }, // farm
    { building: 14, x: 72, y: 54 }, // pig farm
  ],
};

export const buildPopupPageOrder: readonly PopupKind[] = [
  "buildBasic",
  "buildAdv1",
  "buildAdv2",
];

// The flip button at (8, 137) cycles the build pages.
export const popupFlipButton = { x: 8, y: 137, width: 16, height: 16 } as const;

export type ResourceStatsEntry = {
  readonly resource: number;
  readonly icon: number;
  readonly iconX: number;
  readonly iconY: number;
  readonly countX: number;
  readonly countY: number;
};

// DrawResourcesBox, exactly: three columns of icons (x 16/56/96, rows every
// 16px from y 9) with counts beside them (x 32/72/112, y offset +4).
export const resourceStatsLayout: readonly ResourceStatsEntry[] = [
  { resource: 6, icon: 0x28, iconX: 16, iconY: 9, countX: 32, countY: 13 }, // lumber
  { resource: 7, icon: 0x29, iconX: 16, iconY: 25, countX: 32, countY: 29 }, // plank
  { resource: 8, icon: 0x2a, iconX: 16, iconY: 41, countX: 32, countY: 45 }, // boat
  { resource: 9, icon: 0x2b, iconX: 16, iconY: 57, countX: 32, countY: 61 }, // stone
  { resource: 12, icon: 0x2e, iconX: 16, iconY: 73, countX: 32, countY: 77 }, // coal
  { resource: 10, icon: 0x2c, iconX: 16, iconY: 89, countX: 32, countY: 93 }, // iron ore
  { resource: 11, icon: 0x2d, iconX: 16, iconY: 105, countX: 32, countY: 109 }, // steel
  { resource: 13, icon: 0x2f, iconX: 16, iconY: 121, countX: 32, countY: 125 }, // gold ore
  { resource: 14, icon: 0x30, iconX: 16, iconY: 137, countX: 32, countY: 141 }, // gold bar
  { resource: 15, icon: 0x31, iconX: 56, iconY: 9, countX: 72, countY: 13 }, // shovel
  { resource: 16, icon: 0x32, iconX: 56, iconY: 25, countX: 72, countY: 29 }, // hammer
  { resource: 20, icon: 0x36, iconX: 56, iconY: 41, countX: 72, countY: 45 }, // axe
  { resource: 21, icon: 0x37, iconX: 56, iconY: 57, countX: 72, countY: 61 }, // saw
  { resource: 19, icon: 0x35, iconX: 56, iconY: 73, countX: 72, countY: 77 }, // scythe
  { resource: 22, icon: 0x38, iconX: 56, iconY: 89, countX: 72, countY: 93 }, // pick
  { resource: 23, icon: 0x39, iconX: 56, iconY: 105, countX: 72, countY: 109 }, // pincer
  { resource: 18, icon: 0x34, iconX: 56, iconY: 121, countX: 72, countY: 125 }, // cleaver
  { resource: 17, icon: 0x33, iconX: 56, iconY: 137, countX: 72, countY: 141 }, // rod
  { resource: 24, icon: 0x3a, iconX: 96, iconY: 9, countX: 112, countY: 13 }, // sword
  { resource: 25, icon: 0x3b, iconX: 96, iconY: 25, countX: 112, countY: 29 }, // shield
  { resource: 0, icon: 0x22, iconX: 96, iconY: 41, countX: 112, countY: 45 }, // fish
  { resource: 1, icon: 0x23, iconX: 96, iconY: 57, countX: 112, countY: 61 }, // pig
  { resource: 2, icon: 0x24, iconX: 96, iconY: 73, countX: 112, countY: 77 }, // meat
  { resource: 3, icon: 0x25, iconX: 96, iconY: 89, countX: 112, countY: 93 }, // wheat
  { resource: 4, icon: 0x26, iconX: 96, iconY: 105, countX: 112, countY: 109 }, // flour
  { resource: 5, icon: 0x27, iconX: 96, iconY: 121, countX: 112, countY: 125 }, // bread
];

// The popup interior background tiles a 16x16 icon pattern
// (PopupBox.BackgroundPattern.DiagonalGreen).
export const popupBackgroundIcon = 310;

const buildItemHitWidth = 44;
const buildItemHitHeight = 40;

// Which build item a canvas pixel hits inside an open build popup.
export function popupBuildItemAt(
  rect: PopupRect,
  scale: number,
  page: PopupKind,
  pointX: number,
  pointY: number,
): BuildPopupItem | "flip" | null {
  const items = buildPopupPages[page];
  if (items === undefined) {
    return null;
  }

  const flipX = rect.x + popupFlipButton.x * scale;
  const flipY = rect.y + popupFlipButton.y * scale;
  if (
    pointX >= flipX &&
    pointX < flipX + popupFlipButton.width * scale &&
    pointY >= flipY &&
    pointY < flipY + popupFlipButton.height * scale
  ) {
    return "flip";
  }

  for (const item of items) {
    const x = rect.x + item.x * scale;
    const y = rect.y + item.y * scale;
    if (
      pointX >= x &&
      pointX < x + buildItemHitWidth * scale &&
      pointY >= y &&
      pointY < y + buildItemHitHeight * scale
    ) {
      return item;
    }
  }

  return null;
}

// Sett popup: the knight occupation rows (threat levels 0..3) cycle
// through the reference occupation values on click.
export const knightOccupationCycle: readonly number[] = [0x10, 0x21, 0x32, 0x43];

export const settOccupationRows: readonly { readonly y: number }[] = [
  { y: 24 },
  { y: 56 },
  { y: 88 },
  { y: 120 },
];

// --- minimap (UI/Minimap.cs, condensed) ------------------------------------

// The 128x128 minimap pixels sit inside the popup box.
export const minimapInterior = { x: 8, y: 16, width: 128, height: 128 } as const;

// Terrain colors sampled from the reference Minimap color table, one per
// terrain type (the per-height shading lands with the full minimap modes).
export const minimapTerrainColors: readonly (readonly [number, number, number])[] = [
  [0x00, 0x00, 0xaf], // water0
  [0x00, 0x00, 0xaf], // water1
  [0x00, 0x00, 0xaf], // water2
  [0x00, 0x00, 0xaf], // water3
  [0x73, 0xb3, 0x43], // grass0
  [0x6b, 0xab, 0x3b], // grass1
  [0x63, 0xa3, 0x33], // grass2
  [0x57, 0x93, 0x27], // grass3
  [0xef, 0xcf, 0xaf], // desert0
  [0xe3, 0xbf, 0x9f], // desert1
  [0xd7, 0xb3, 0x8f], // desert2
  [0xab, 0x7b, 0x5b], // tundra0
  [0x9f, 0x6f, 0x4f], // tundra1
  [0x93, 0x63, 0x43], // tundra2
  [0xff, 0xff, 0xff], // snow0
  [0xef, 0xef, 0xef], // snow1
];

// Which map tile a canvas pixel hits inside the open minimap; null
// outside the 128x128 pixel field.
export function minimapTileAt(
  rect: PopupRect,
  scale: number,
  pointX: number,
  pointY: number,
  columns: number,
  rows: number,
): { column: number; row: number } | null {
  const fieldX = rect.x + minimapInterior.x * scale;
  const fieldY = rect.y + minimapInterior.y * scale;
  const fieldWidth = minimapInterior.width * scale;
  const fieldHeight = minimapInterior.height * scale;
  if (
    pointX < fieldX ||
    pointX >= fieldX + fieldWidth ||
    pointY < fieldY ||
    pointY >= fieldY + fieldHeight
  ) {
    return null;
  }

  return {
    column: Math.floor(((pointX - fieldX) / fieldWidth) * columns) % columns,
    row: Math.floor(((pointY - fieldY) / fieldHeight) * rows) % rows,
  };
}

// The sett popup's audio row: SFX on the left half, MUSIC on the right.
// At 144 the 8px text row stays inside the interior (the bottom border
// starts at 153).
export const settAudioRowY = 144;

export function settAudioToggleAt(
  rect: PopupRect,
  scale: number,
  pointX: number,
  pointY: number,
): "sfx" | "music" | null {
  const top = rect.y + settAudioRowY * scale;
  if (pointY < top || pointY >= top + 12 * scale) {
    return null;
  }

  if (pointX >= rect.x + 8 * scale && pointX < rect.x + 72 * scale) {
    return "sfx";
  }

  if (pointX >= rect.x + 72 * scale && pointX < rect.x + (popupWidth - 8) * scale) {
    return "music";
  }

  return null;
}

export function settOccupationRowAt(
  rect: PopupRect,
  scale: number,
  pointX: number,
  pointY: number,
): number | null {
  for (let row = 0; row < settOccupationRows.length; row += 1) {
    const y = rect.y + settOccupationRows[row]!.y * scale;
    if (
      pointX >= rect.x + 8 * scale &&
      pointX < rect.x + (popupWidth - 8) * scale &&
      pointY >= y &&
      pointY < y + 24 * scale
    ) {
      return row;
    }
  }

  return null;
}
