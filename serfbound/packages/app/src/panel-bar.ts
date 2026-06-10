import type { RenderSize } from "@serfbound/engine";

// The authentic panel bar, ported from Freeserf.Core/UI/PanelBar.cs as
// browser-native logic: the reference 320x40 layout with five 32x32
// panel_button slots at (64 + i * 48, 4) over a frame_bottom background.

export const panelButtonId = {
  buildInactive: 0,
  buildFlag: 1,
  buildMine: 2,
  buildSmall: 3,
  buildLarge: 4,
  buildCastle: 5,
  destroy: 6,
  destroyInactive: 7,
  buildRoad: 8,
  mapInactive: 9,
  map: 10,
  statsInactive: 11,
  stats: 12,
  settInactive: 13,
  sett: 14,
  destroyRoad: 15,
  groundAnalysis: 16,
  buildRoadStarred: 25,
} as const;

// PanelBar.BackgroundLayout: frame_bottom sprite ids with x/y offsets.
export const panelBackgroundLayout: readonly (readonly [number, number, number])[] = [
  [6, 0, 0],
  [0, 40, 0],
  [20, 48, 0],
  [7, 64, 0],
  [8, 64, 36],
  [21, 96, 0],
  [9, 112, 0],
  [10, 112, 36],
  [22, 144, 0],
  [11, 160, 0],
  [12, 160, 36],
  [23, 192, 0],
  [13, 208, 0],
  [14, 208, 36],
  [24, 240, 0],
  [15, 256, 0],
  [16, 256, 36],
  [25, 288, 0],
  [1, 304, 0],
  [6, 312, 0],
];

// Narrow (mobile) canvases drop the chrome to 1x so the original
// 320-wide layout still fits. The decision is made in CSS pixels; the
// result multiplies by the integer device pixel ratio so chrome keeps
// its apparent size on high-DPI backing stores while rendering sharp
// (SB-21-03).
export function uiScaleFor(canvas: RenderSize, pixelRatio = 1): number {
  const ratio = Math.max(1, Math.round(pixelRatio));
  return (canvas.width / ratio < 700 ? 1 : 2) * ratio;
}

export const panelBarWidth = 320;
export const panelBarHeight = 40;
export const panelButtonSize = 32;
export const panelButtonSlotCount = 5;

export type PanelBarRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

// The bar docks bottom-center like the original 320-wide screen.
export function panelBarRect(canvas: RenderSize, scale: number): PanelBarRect {
  const width = panelBarWidth * scale;
  const height = panelBarHeight * scale;
  return {
    x: Math.max(0, Math.floor((canvas.width - width) / 2)),
    y: Math.max(0, canvas.height - height),
    width,
    height,
  };
}

export function panelButtonSlotRect(rect: PanelBarRect, scale: number, slot: number): PanelBarRect {
  return {
    x: rect.x + (64 + slot * 48) * scale,
    y: rect.y + 4 * scale,
    width: panelButtonSize * scale,
    height: panelButtonSize * scale,
  };
}

// Which button slot a canvas pixel hits, or null outside every slot.
export function panelButtonAt(
  rect: PanelBarRect,
  scale: number,
  pointX: number,
  pointY: number,
): number | null {
  for (let slot = 0; slot < panelButtonSlotCount; slot += 1) {
    const slotRect = panelButtonSlotRect(rect, scale, slot);
    if (
      pointX >= slotRect.x &&
      pointX < slotRect.x + slotRect.width &&
      pointY >= slotRect.y &&
      pointY < slotRect.y + slotRect.height
    ) {
      return slot;
    }
  }

  return null;
}

export function pointInPanelBar(rect: PanelBarRect, pointX: number, pointY: number): boolean {
  return (
    pointX >= rect.x &&
    pointX < rect.x + rect.width &&
    pointY >= rect.y &&
    pointY < rect.y + rect.height
  );
}

export type PanelBuildPossibility = "castle" | "large" | "small" | "mine" | "flag" | "none";

export type PanelBarButtonsState = {
  readonly buildPossibility: PanelBuildPossibility;
  readonly roadMode: boolean;
};

// The five slots' panel_button sprite ids for the current game state
// (reference ButtonTypeFromBuildPossibility; map/stats/sett active with
// their popups).
export function panelButtonSprites(state: PanelBarButtonsState): number[] {
  let build: number = panelButtonId.buildInactive;
  switch (state.buildPossibility) {
    case "castle":
      build = panelButtonId.buildCastle;
      break;
    case "large":
      build = panelButtonId.buildLarge;
      break;
    case "small":
      build = panelButtonId.buildSmall;
      break;
    case "mine":
      build = panelButtonId.buildMine;
      break;
    case "flag":
      build = panelButtonId.buildFlag;
      break;
    default:
      break;
  }

  return [
    build,
    state.roadMode ? panelButtonId.buildRoadStarred : panelButtonId.buildRoad,
    panelButtonId.map,
    panelButtonId.stats,
    panelButtonId.sett,
  ];
}
