import type { RenderSize } from "@serfbound/engine";
import type { PopupRect } from "./popup.js";

// The authentic game start screen (UI/GameInitBox.cs, condensed to the
// custom-game options the engine supports): seed, player supplies, map
// size, and the start action, rendered with decoded art on the canvas.

export const initBoxWidth = 144;
export const initBoxHeight = 128;

export type InitScreenSettings = {
  readonly seedString: string;
  readonly initialSupplies: number;
  readonly mapSize: number;
};

export function initScreenRect(canvas: RenderSize, scale: number): PopupRect {
  const width = initBoxWidth * scale;
  const height = initBoxHeight * scale;
  return {
    x: Math.max(0, Math.floor((canvas.width - width) / 2)),
    y: Math.max(0, Math.floor((canvas.height - height) / 3)),
    width,
    height,
  };
}

// Interactive rows: seed (click randomizes), supplies (click cycles), and
// the start action.
export const initScreenRows = {
  seed: { y: 24, height: 24 },
  supplies: { y: 56, height: 16 },
  mission: { y: 86, height: 12 },
  start: { y: 104, height: 18 },
} as const;

export type InitScreenRow = keyof typeof initScreenRows;

export function initScreenRowAt(
  rect: PopupRect,
  scale: number,
  pointX: number,
  pointY: number,
): InitScreenRow | null {
  if (
    pointX < rect.x ||
    pointX >= rect.x + rect.width ||
    pointY < rect.y ||
    pointY >= rect.y + rect.height
  ) {
    return null;
  }

  for (const [row, bounds] of Object.entries(initScreenRows)) {
    const top = rect.y + bounds.y * scale;
    if (pointY >= top && pointY < top + bounds.height * scale) {
      return row as InitScreenRow;
    }
  }

  return null;
}

// The reference custom-game supplies steps, condensed to three stops.
export const suppliesCycle: readonly number[] = [5, 20, 35];

export function nextSupplies(current: number): number {
  const index = suppliesCycle.indexOf(current);
  return suppliesCycle[(index + 1) % suppliesCycle.length]!;
}

// A fresh 16-digit seed in the reference 1..8 alphabet.
export function randomSeedString(randomValue: () => number): string {
  let seed = "";
  for (let digit = 0; digit < 16; digit += 1) {
    seed += String(1 + Math.floor(randomValue() * 8) % 8);
  }

  return seed;
}
