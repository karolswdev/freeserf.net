import { panelBackgroundLayout, panelBarRect, uiScaleFor } from "./panel-bar.js";
import {
  buildPopupPages,
  minimapInterior,
  minimapTerrainColors,
  popupBackgroundIcon,
  popupBorderLayout,
  popupFlipButton,
  popupHeight,
  popupInterior,
  popupRect,
  popupWidth,
  resourceStatsLayout,
  settAudioRowY,
  settOccupationRows,
  type PopupKind,
} from "./popup.js";
import {
  buildSpriteAtlas,
  composeMaskedTile,
  composeSerfTorso,
  layoutUiText,
  parseSerfAnimationTable,
  terrainGroundSpriteIndex,
  triangleMaskCodeDown,
  triangleMaskCodeUp,
  type DecodedDosSprite,
  type SerfAnimationTable,
  type SpriteAtlas,
} from "@serfbound/assets";
import type {
  ClassicMapLandscape,
  MapPoint,
  RenderSize,
  SerfboundBuiltStructure,
  SerfboundGameWorld,
} from "@serfbound/engine";
import {
  renderLayerOrder,
  type DecodedRenderAssets,
  type FirstRenderLayerScene,
  type RenderLayerKey,
  type RenderScenePrimitive,
  type RenderSpritePrimitive,
} from "./render-layer-scene.js";

// Landscape rendering over the generated world (SB-11-04). Placement follows
// Freeserf.Core/Render/RenderMap: lattice vertex (c, r) maps to map position
// (scrollColumn + c + ceil(r/2), scrollRow + r); every map position is the
// apex of one up triangle (band below) and one down triangle (band above).

const tileWidth = 32;
const tileHeight = 20;
const heightStep = 4;
// The tallest mask is 41px and heights lift sprites up to 4*31 = 124px, so
// the lattice extends beyond the viewport on every side.
const extraRowsBelow = 8;
const extraRowsAbove = 2;
const extraColumns = 2;

export type MapScroll = {
  readonly column: number;
  readonly row: number;
};

export type LandscapeRenderAssets = {
  readonly atlas: SpriteAtlas;
  readonly landscape: ClassicMapLandscape;
  readonly terrainComboCount: number;
  readonly objectSpriteCount: number;
  readonly waveFrameCount: number;
  readonly pathComboCount: number;
  readonly serfAnimationTable: SerfAnimationTable | null;
  readonly serfBodyCount: number;
  // Decoded UI chrome counts (SB-16-01 foundation evidence).
  readonly uiGlyphCount: number;
  readonly uiIconCount: number;
};

// RenderSerf.AppearanceIndex1/2 map an animation frame's sprite byte to the
// torso body and head sprite indices.
const appearanceIndex1: readonly number[] = [
  0, 0, 48, 6, 96, -1, 48, 24,
  240, -1, 48, 30, 248, -1, 48, 12,
  48, 18, 96, 306, 96, 300, 48, 54,
  48, 72, 48, 36, 0, 48, 272, -1,
  48, 60, 264, -1, 48, 42, 280, -1,
  48, 66, 96, 312, 500, 600, 48, 318,
  48, 78, 0, 84, 48, 90, 48, 96,
  48, 102, 48, 108, 48, 114, 96, 324,
  96, 330, 96, 336, 96, 342, 96, 348,
  48, 354, 48, 360, 48, 366, 48, 372,
  48, 378, 48, 384, 504, 604, 509, -1,
  48, 120, 288, -1, 288, 420, 48, 126,
  48, 132, 96, 426, 0, 138, 304, -1,
  48, 390, 48, 144, 96, 432, 48, 198,
  510, 608, 48, 204, 48, 402, 48, 150,
  96, 438, 48, 156, 312, -1, 320, -1,
  48, 162, 48, 168, 96, 444, 0, 174,
  513, -1, 48, 408, 48, 180, 96, 450,
  0, 186, 520, -1, 48, 414, 48, 192,
  96, 456, 328, -1, 48, 210, 344, -1,
  48, 6, 48, 6, 48, 216, 528, -1,
  48, 534, 48, 528, 48, 288, 48, 282,
  48, 222, 533, -1, 48, 540, 48, 546,
  48, 552, 48, 558, 48, 564, 96, 468,
  96, 462, 48, 570, 48, 576, 48, 582,
  48, 396, 48, 228, 48, 234, 48, 240,
  48, 246, 48, 252, 48, 258, 48, 264,
  48, 270, 48, 276, 96, 474, 96, 480,
  96, 486, 96, 492, 96, 498, 96, 504,
  96, 510, 96, 516, 96, 522, 96, 612,
  144, 294, 144, 588, 144, 594, 144, 618,
  144, 624, 401, 294, 352, 297, 401, 588,
  352, 591, 401, 594, 352, 597, 401, 618,
  352, 621, 401, 624, 352, 627, 450, -1,
  192, -1,
];

const appearanceIndex2: readonly number[] = [
  0, 0, 1, 0, 2, 0, 3, 0,
  4, 0, 5, 0, 6, 0, 7, 0,
  8, 1, 9, 1, 10, 1, 11, 1,
  12, 1, 13, 1, 14, 1, 15, 1,
  16, 2, 17, 2, 18, 2, 19, 2,
  20, 2, 21, 2, 22, 2, 23, 2,
  24, 3, 25, 3, 26, 3, 27, 3,
  28, 3, 29, 3, 30, 3, 31, 3,
  32, 4, 33, 4, 34, 4, 35, 4,
  36, 4, 37, 4, 38, 4, 39, 4,
  40, 5, 41, 5, 42, 5, 43, 5,
  44, 5, 45, 5, 46, 5, 47, 5,
  0, 0, 1, 0, 2, 0, 3, 0,
  4, 0, 5, 0, 6, 0, 2, 0,
  0, 1, 1, 1, 2, 1, 3, 1,
  4, 1, 5, 1, 6, 1, 2, 1,
  0, 2, 1, 2, 2, 2, 3, 2,
  4, 2, 5, 2, 6, 2, 2, 2,
  0, 3, 1, 3, 2, 3, 3, 3,
  4, 3, 5, 3, 6, 3, 2, 3,
  0, 0, 1, 0, 2, 0, 3, 0,
  4, 0, 5, 0, 6, 0, 7, 0,
  8, 0, 9, 0, 10, 0, 11, 0,
  12, 0, 13, 0, 14, 0, 15, 0,
  16, 0, 17, 0, 18, 0, 19, 0,
  20, 0, 21, 0, 22, 0, 23, 0,
  24, 0, 25, 0, 26, 0, 27, 0,
  28, 0, 29, 0, 30, 0, 31, 0,
  32, 0, 33, 0, 34, 0, 35, 0,
  36, 0, 37, 0, 38, 0, 39, 0,
  40, 0, 41, 0, 42, 0, 43, 0,
  44, 0, 45, 0, 46, 0, 47, 0,
  48, 0, 49, 0, 50, 0, 51, 0,
  52, 0, 53, 0, 54, 0, 55, 0,
  56, 0, 57, 0, 58, 0, 59, 0,
  60, 0, 61, 0, 62, 0, 63, 0,
  64, 0,
];

// RenderSerf.GetHeadSprite: frame sprite byte -> torso body + head indices.
export function serfBodyAndHead(frameSprite: number): { body: number; head: number } | null {
  const hi = ((frameSprite >> 8) & 0xff) * 2;
  const lo = (frameSprite & 0xff) * 2;
  let body = appearanceIndex1[hi] ?? -1;
  let head = appearanceIndex1[hi + 1] ?? -1;
  if (body < 0) {
    return null;
  }

  body += appearanceIndex2[lo] ?? 0;
  if (head >= 0) {
    head += appearanceIndex2[lo + 1] ?? 0;
  }

  return { body, head };
}

function wrap(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function landscapePosition(
  landscape: ClassicMapLandscape,
  column: number,
  row: number,
): number {
  return wrap(row, landscape.rows) * landscape.columns + wrap(column, landscape.columns);
}

type TriangleFacts = {
  readonly terrain: number;
  readonly maskCode: number;
};

function upTriangleFacts(landscape: ClassicMapLandscape, position: number): TriangleFacts | null {
  const column = position % landscape.columns;
  const row = Math.trunc(position / landscape.columns);
  const apexHeight = landscape.heights[position]!;
  const left = landscape.heights[landscapePosition(landscape, column, row + 1)]!;
  const right = landscape.heights[landscapePosition(landscape, column + 1, row + 1)]!;
  const maskCode =
    triangleMaskCodeUp(apexHeight, left, right) ??
    triangleMaskCodeUp(
      apexHeight,
      clampNeighbor(apexHeight, left),
      clampNeighbor(apexHeight, right),
    );
  if (maskCode === null) {
    return null;
  }

  return { terrain: landscape.typesUp[position]!, maskCode };
}

function downTriangleFacts(landscape: ClassicMapLandscape, position: number): TriangleFacts | null {
  const column = position % landscape.columns;
  const row = Math.trunc(position / landscape.columns);
  const apexHeight = landscape.heights[position]!;
  const upLeftPosition = landscapePosition(landscape, column - 1, row - 1);
  const left = landscape.heights[upLeftPosition]!;
  const right = landscape.heights[landscapePosition(landscape, column, row - 1)]!;
  const maskCode =
    triangleMaskCodeDown(apexHeight, left, right) ??
    triangleMaskCodeDown(
      apexHeight,
      clampNeighbor(apexHeight, left),
      clampNeighbor(apexHeight, right),
    );
  if (maskCode === null) {
    return null;
  }

  return { terrain: landscape.typesDown[upLeftPosition]!, maskCode };
}

function clampNeighbor(apexHeight: number, neighborHeight: number): number {
  return apexHeight + Math.max(-4, Math.min(4, neighborHeight - apexHeight));
}

// RenderBuilding.MapBuildingSprite: map_object sprite index per building type.
export const mapBuildingSprite: readonly number[] = [
  0, 0xa7, 0xa8, 0xae, 0xa9,
  0xa3, 0xa4, 0xa5, 0xa6,
  0xaa, 0xc0, 0xab, 0x9a, 0x9c, 0x9b, 0xbc,
  0xa2, 0xa0, 0xa1, 0x99, 0x9d, 0x9e, 0x98, 0x9f, 0xb2,
];

// RenderBuilding.MapBuildingFrameSprite: under-construction frame sprites.
export const mapBuildingFrameSprite: readonly number[] = [
  0, 0xba, 0xba, 0xba, 0xba,
  0xb9, 0xb9, 0xb9, 0xb9,
  0xba, 0xc1, 0xba, 0xb1, 0xb8, 0xb1, 0xbb,
  0xb7, 0xb5, 0xb6, 0xb0, 0xb8, 0xb3, 0xaf, 0xb4,
];

export function buildLandscapeRenderAssets(
  decodedAssets: DecodedRenderAssets,
  landscape: ClassicMapLandscape,
): LandscapeRenderAssets | null {
  const sprites: Record<string, DecodedDosSprite> = {};
  let terrainComboCount = 0;

  const composeCombo = (orientation: "up" | "down", facts: TriangleFacts): void => {
    const key = `t${orientation === "up" ? "u" : "d"}:${facts.terrain}:${facts.maskCode}`;
    if (sprites[key] !== undefined) {
      return;
    }

    const groundIndex = terrainGroundSpriteIndex(facts.terrain, facts.maskCode, orientation);
    const ground = decodedAssets.rawGrounds[groundIndex];
    const mask = (orientation === "up" ? decodedAssets.rawMasksUp : decodedAssets.rawMasksDown)[
      facts.maskCode
    ];
    if (ground === null || ground === undefined || mask === null || mask === undefined) {
      return;
    }

    sprites[key] = composeMaskedTile(ground, mask);
    terrainComboCount += 1;
  };

  for (let position = 0; position < landscape.tileCount; position += 1) {
    const up = upTriangleFacts(landscape, position);
    if (up !== null) {
      composeCombo("up", up);
    }

    const down = downTriangleFacts(landscape, position);
    if (down !== null) {
      composeCombo("down", down);
    }
  }

  if (terrainComboCount === 0) {
    return null;
  }

  let objectSpriteCount = 0;
  const presentObjects = new Set<number>();
  for (let position = 0; position < landscape.tileCount; position += 1) {
    const objectType = landscape.objects[position]!;
    if (objectType >= 8) {
      presentObjects.add(objectType - 8);
    }
  }

  for (const spriteIndex of presentObjects) {
    const decoded = decodedAssets.rawMapObjects.get(spriteIndex);
    if (decoded === undefined) {
      continue;
    }

    sprites[`mo:${spriteIndex}`] = decoded.sprite;
    objectSpriteCount += 1;
    if (decoded.shadow !== null) {
      sprites[`mos:${spriteIndex}`] = decoded.shadow;
    }
  }

  const flag = decodedAssets.rawMapObjects.get(128);
  if (flag !== undefined) {
    sprites["obj:flag"] = flag.sprite;
    if (flag.shadow !== null) {
      sprites["objshadow:flag"] = flag.shadow;
    }
  }

  // All building sprites (done + frame stages) precompose so construction at
  // any time resolves.
  for (const spriteIndex of [...mapBuildingSprite, ...mapBuildingFrameSprite]) {
    if (spriteIndex === 0) {
      continue;
    }

    const decoded = decodedAssets.rawMapObjects.get(spriteIndex);
    if (decoded === undefined) {
      continue;
    }

    sprites[`mo:${spriteIndex}`] = decoded.sprite;
    if (decoded.shadow !== null) {
      sprites[`mos:${spriteIndex}`] = decoded.shadow;
    }
  }

  // Territory border sprites.
  for (let borderIndex = 0; borderIndex < decodedAssets.rawBorders.length; borderIndex += 1) {
    const border = decodedAssets.rawBorders[borderIndex];
    if (border !== null && border !== undefined) {
      sprites[`border:${borderIndex}`] = border;
    }
  }

  // Serf torsos and heads for walking bodies.
  let serfBodyCount = 0;
  for (const [body, torso] of decodedAssets.rawSerfTorsos) {
    sprites[`serft:${body}`] = torso.sprite;
    serfBodyCount += 1;
  }

  for (const [head, sprite] of decodedAssets.rawSerfHeads) {
    sprites[`serfh:${head}`] = sprite;
  }

  // Decoded UI chrome (SB-16-01): font glyphs, icons, panel buttons,
  // popup frames, and the cursor. UI sprites anchor at their top-left
  // (header offsets only matter for map placement).
  let uiGlyphCount = 0;
  decodedAssets.rawFontGlyphs.forEach((glyph, index) => {
    if (glyph !== null) {
      sprites[`uif:${index}`] = stripOffsets(glyph);
      uiGlyphCount += 1;
    }
  });
  decodedAssets.rawFontShadows.forEach((glyph, index) => {
    if (glyph !== null) {
      sprites[`uifs:${index}`] = stripOffsets(glyph);
    }
  });
  for (const [index, icon] of decodedAssets.rawIcons) {
    sprites[`uii:${index}`] = stripOffsets(icon);
  }
  for (const [index, button] of decodedAssets.rawPanelButtons) {
    sprites[`uip:${index}`] = stripOffsets(button);
  }
  decodedAssets.rawPopupFrames.forEach((frame, index) => {
    if (frame !== null) {
      sprites[`uifr:${index}`] = stripOffsets(frame);
    }
  });
  decodedAssets.rawBottomFrames.forEach((frame, index) => {
    if (frame !== null) {
      sprites[`uifb:${index}`] = stripOffsets(frame);
    }
  });
  if (decodedAssets.rawCursor !== null) {
    sprites["uic"] = stripOffsets(decodedAssets.rawCursor);
  }

  // Waves: 16 frames, each in three shore variants per the reference
  // (full, masked by up mask 40, masked by down mask 40; masks widened to the
  // 48px wave width).
  let waveFrameCount = 0;
  const upShoreMask = widenMask(decodedAssets.rawMasksUp[40] ?? null, 48, 25);
  const downShoreMask = widenMask(decodedAssets.rawMasksDown[40] ?? null, 48, 25);
  for (let frame = 0; frame < 16; frame += 1) {
    const wave = decodedAssets.rawWaves[frame];
    if (wave === null || wave === undefined) {
      continue;
    }

    sprites[`wave:${frame}:full`] = stripOffsets(wave);
    if (upShoreMask !== null) {
      sprites[`wave:${frame}:up`] = stripOffsets(composeMaskedTile(wave, upShoreMask));
    }

    if (downShoreMask !== null) {
      sprites[`wave:${frame}:down`] = stripOffsets(composeMaskedTile(wave, downShoreMask));
    }

    waveFrameCount += 1;
  }

  // Roads: every path_ground x path_mask combo precomposes so roads built at
  // any time during play resolve without atlas rebuilds (10 x 27 sprites).
  let pathComboCount = 0;
  for (let groundIndex = 0; groundIndex < decodedAssets.rawPathGrounds.length; groundIndex += 1) {
    const ground = decodedAssets.rawPathGrounds[groundIndex];
    if (ground === null || ground === undefined) {
      continue;
    }

    for (let maskIndex = 0; maskIndex < decodedAssets.rawPathMasks.length; maskIndex += 1) {
      const mask = decodedAssets.rawPathMasks[maskIndex];
      if (mask === null || mask === undefined) {
        continue;
      }

      sprites[`path:${groundIndex}:${maskIndex}`] = stripOffsets(composeMaskedTile(ground, mask));
      pathComboCount += 1;
    }
  }

  return {
    atlas: buildSpriteAtlas(sprites),
    landscape,
    terrainComboCount,
    objectSpriteCount,
    waveFrameCount,
    pathComboCount,
    serfAnimationTable: decodedAssets.serfAnimationTable,
    serfBodyCount,
    uiGlyphCount,
    uiIconCount: decodedAssets.rawIcons.size,
  };
}

// Waves draw at computed positions, not via their sprite header offsets.
function stripOffsets(sprite: DecodedDosSprite): DecodedDosSprite {
  return { ...sprite, deltaX: 0, deltaY: 0, offsetX: 0, offsetY: 0 };
}

// Mirrors the reference Sprite.ClearTo: the mask keeps its pixels at the top
// left of a larger transparent canvas.
function widenMask(
  mask: DecodedDosSprite | null,
  width: number,
  height: number,
): DecodedDosSprite | null {
  if (mask === null) {
    return null;
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < Math.min(mask.height, height); y += 1) {
    const sourceOffset = y * mask.width * 4;
    const targetOffset = y * width * 4;
    rgba.set(
      mask.rgba.subarray(sourceOffset, sourceOffset + Math.min(mask.width, width) * 4),
      targetOffset,
    );
  }

  return { deltaX: 0, deltaY: 0, width, height, offsetX: 0, offsetY: 0, rgba };
}

export type LandscapeSceneOptions = {
  readonly size: RenderSize;
  readonly assets: LandscapeRenderAssets;
  readonly scroll: MapScroll;
  readonly builtStructures?: readonly SerfboundBuiltStructure[];
  readonly definedArchiveEntries?: number;
  // Animation tick; wave frames advance every 8 ticks like the reference.
  readonly tick?: number;
  // Live game world; when present, terrain/objects/roads/flags render from
  // its mutable state instead of the pristine landscape.
  readonly world?: SerfboundGameWorld;
  // Active serfs to render (position, animation state).
  readonly serfs?: readonly {
    readonly position: number;
    readonly animation: number;
    readonly counter: number;
  }[];
  // The authentic panel bar: the five slots' panel_button sprite ids
  // (SB-16-02; computed from game state by the shell).
  readonly panel?: { readonly buttons: readonly number[] };
  // The open popup, if any (SB-16-03).
  readonly popup?: { readonly kind: PopupKind };
  // A notification banner in the game font (SB-16-04).
  readonly notice?: string;
  // Audio settings shown in the sett popup (SB-17-03).
  readonly audio?: { readonly sfxMuted: boolean; readonly musicMuted: boolean };
  // World view scale (SB-21-03): integer zoom of the map layers — the
  // modern SVGA. UI chrome scales independently via uiScaleFor.
  readonly view?: { readonly scale?: number };
  // Device pixel ratio backing the canvas; keeps the UI chrome at its
  // apparent CSS size on high-DPI backing stores.
  readonly pixelRatio?: number;
};

export function createLandscapeScene(options: LandscapeSceneOptions): FirstRenderLayerScene {
  const { atlas } = options.assets;
  // The live world supersedes the pristine landscape when present (castle
  // leveling mutates heights; buildings/flags mutate objects).
  const landscape = options.world ?? options.assets.landscape;
  const scrollColumn = wrap(Math.trunc(options.scroll.column), landscape.columns);
  const scrollRow = wrap(Math.trunc(options.scroll.row), landscape.rows);
  const sprites: RenderSpritePrimitive[] = [];
  const primitives: RenderScenePrimitive[] = [];

  // World view scale: map-layer geometry computes in map space and
  // scales up at the push seam; the visible lattice shrinks to match.
  const viewScale = Math.max(1, Math.trunc(options.view?.scale ?? 1));

  const pushSprite = (
    layer: RenderLayerKey,
    key: string,
    anchorX: number,
    anchorY: number,
    sortY: number,
    sortX: number,
  ): void => {
    const region = atlas.regions[key];
    if (region === undefined) {
      return;
    }

    sprites.push({
      layer,
      key,
      x: (anchorX + region.offsetX) * viewScale,
      y: (anchorY + region.offsetY) * viewScale,
      sortY,
      sortX,
      ...(viewScale === 1 ? {} : { scale: viewScale }),
    });
  };

  const latticeColumns = Math.ceil(options.size.width / (tileWidth * viewScale)) + extraColumns;
  const latticeRows = Math.ceil(options.size.height / (tileHeight * viewScale)) + extraRowsBelow;

  for (let r = -extraRowsAbove; r <= latticeRows; r += 1) {
    const mapRow = scrollRow + r;
    const columnShift = (r + (r & 1)) >> 1;
    const stagger = (r & 1) === 1 ? tileWidth / 2 : 0;

    for (let c = -1; c <= latticeColumns; c += 1) {
      const position = landscapePosition(landscape, scrollColumn + c + columnShift, mapRow);
      const apexHeight = landscape.heights[position]!;
      const apexX = c * tileWidth + stagger;
      const apexY = r * tileHeight - heightStep * apexHeight;

      const up = upTriangleFacts(landscape, position);
      if (up !== null) {
        pushSprite(
          "terrain",
          `tu:${up.terrain}:${up.maskCode}`,
          apexX - tileWidth / 2,
          apexY,
          apexY,
          apexX,
        );
      }

      const down = downTriangleFacts(landscape, position);
      if (down !== null) {
        pushSprite(
          "terrain",
          `td:${down.terrain}:${down.maskCode}`,
          apexX - tileWidth / 2,
          apexY,
          apexY,
          apexX,
        );
      }

      const objectType = landscape.objects[position]!;
      if (objectType >= 8) {
        const spriteIndex = objectType - 8;
        pushSprite("shadows", `mos:${spriteIndex}`, apexX, apexY, apexY, apexX);
        pushSprite("objects", `mo:${spriteIndex}`, apexX, apexY, apexY, apexX);
      } else if (objectType === 1) {
        // World flags (map object 1) render the real flag sprite.
        pushSprite("shadows", "objshadow:flag", apexX, apexY, apexY, apexX);
        pushSprite("markers", "obj:flag", apexX, apexY, apexY, apexX);
      } else if (objectType >= 2 && objectType <= 4 && options.world !== undefined) {
        // Buildings render their reference map_object sprite by type.
        const building = options.world.buildingAt(position);
        if (building !== null) {
          // Leveling sites show no sprite yet; framed sites show the frame;
          // completed buildings show the finished sprite.
          const spriteIndex = building.isDone
            ? (mapBuildingSprite[building.type] ?? 0)
            : building.progress >= 1
              ? (mapBuildingFrameSprite[building.type] ?? 0)
              : 0;
          if (spriteIndex !== 0) {
            pushSprite("shadows", `mos:${spriteIndex}`, apexX, apexY, apexY, apexX);
            pushSprite("objects", `mo:${spriteIndex}`, apexX, apexY, apexY, apexX);
          }
        }
      }

      // Territory borders: a border sprite marks every edge whose two
      // positions have different owners. Sprite selection is simplified to a
      // deterministic terrain/parity pick until the RenderBorderSegment port.
      if (options.world !== undefined) {
        const world = options.world;
        const borderDirections = [
          { direction: "Right", dx: tileWidth / 2, dy: 0 },
          { direction: "DownRight", dx: tileWidth / 4, dy: tileHeight / 2 },
          { direction: "Down", dx: -tileWidth / 4, dy: tileHeight / 2 },
        ] as const;
        for (const { direction, dx, dy } of borderDirections) {
          const other = world.move(position, direction);
          if (world.owners[position] !== world.owners[other]!) {
            const waterEdge =
              landscape.typesUp[position]! <= 3 || landscape.typesUp[other]! <= 3;
            const borderIndex = (waterEdge ? 6 : 0) + ((position ^ other) & 1);
            const otherHeight = landscape.heights[other]!;
            const midY =
              r * tileHeight + dy - heightStep * Math.trunc((apexHeight + otherHeight) / 2);
            pushSprite("markers", `border:${borderIndex}`, apexX + dx, midY, midY, apexX + dx);
          }
        }
      }

      // Road segments per Freeserf.Core/Render/RenderRoadSegment: drawn for
      // Right/DownRight/Down paths with mask = heightDiff + 4 + direction * 9
      // and a ground sprite picked by slope class and terrain class.
      if (options.world !== undefined) {
        const world = options.world;
        const column = position % landscape.columns;
        const row = Math.trunc(position / landscape.columns);
        const h1 = landscape.heights[position]!;

        const roadDirections = [
          { direction: "Right", index: 0 },
          { direction: "DownRight", index: 1 },
          { direction: "Down", index: 2 },
        ] as const;
        for (const { direction, index } of roadDirections) {
          if (!world.hasPath(position, direction)) {
            continue;
          }

          const otherPosition = world.move(position, direction);
          const h2 = landscape.heights[otherPosition]!;
          const heightDifference = h1 - h2;
          const maskIndex = heightDifference + 4 + index * 9;

          let terrain1 = 0;
          let terrain2 = 0;
          let heightDifference2 = 0;
          let segmentX = apexX;
          let segmentY = r * tileHeight;
          if (direction === "Right") {
            terrain1 = landscape.typesDown[position]!;
            terrain2 = landscape.typesUp[landscapePosition(landscape, column, row - 1)]!;
            const h3 = landscape.heights[landscapePosition(landscape, column, row - 1)]!;
            const h4 = landscape.heights[landscapePosition(landscape, column + 1, row + 1)]!;
            heightDifference2 = h3 - h4 - 4 * heightDifference;
            segmentY -= 4 * Math.max(h1, h2) + 2;
          } else if (direction === "DownRight") {
            terrain1 = landscape.typesUp[position]!;
            terrain2 = landscape.typesDown[position]!;
            const h3 = landscape.heights[landscapePosition(landscape, column + 1, row)]!;
            const h4 = landscape.heights[landscapePosition(landscape, column, row + 1)]!;
            heightDifference2 = 2 * (h3 - h4);
            segmentY -= 4 * h1 + 2;
          } else {
            terrain1 = landscape.typesUp[position]!;
            terrain2 = landscape.typesDown[landscapePosition(landscape, column - 1, row)]!;
            const h3 = landscape.heights[landscapePosition(landscape, column - 1, row)]!;
            const h4 = landscape.heights[landscapePosition(landscape, column, row + 1)]!;
            heightDifference2 = 4 * heightDifference - h3 + h4;
            segmentX -= tileWidth / 2;
            segmentY -= 4 * h1 + 2;
          }

          let groundIndex = 0;
          if (heightDifference2 > 4) {
            groundIndex = 0;
          } else if (heightDifference2 > -6) {
            groundIndex = 1;
          } else {
            groundIndex = 2;
          }

          const terrainClass = Math.max(terrain1, terrain2);
          if (terrainClass <= 3) {
            groundIndex = 9; // water
          } else if (terrainClass >= 14) {
            groundIndex += 6; // snow
          } else if (terrainClass >= 8) {
            groundIndex += 3; // desert
          }

          pushSprite("paths", `path:${groundIndex}:${maskIndex}`, segmentX, segmentY, segmentY, segmentX);
        }
      }

      // Waves animate on water; the reference picks the frame from the map
      // position and tick, and masks the shore rows (UpdateWave).
      if (options.assets.waveFrameCount > 0) {
        const typeUp = landscape.typesUp[position]!;
        const typeDown = landscape.typesDown[position]!;
        const frame = ((position ^ 5) + ((options.tick ?? 0) >> 3)) & 0xf;
        const waveX = apexX - tileWidth / 2;
        const waveY = r * tileHeight;
        if (typeUp <= 3 && typeDown <= 3) {
          pushSprite("paths", `wave:${frame}:full`, waveX, waveY, waveY, waveX);
        } else if (typeDown <= 3) {
          pushSprite("paths", `wave:${frame}:down`, waveX + 16, waveY - 4, waveY, waveX);
        } else if (typeUp <= 3) {
          pushSprite("paths", `wave:${frame}:up`, waveX, waveY, waveY, waveX);
        }
      }
    }
  }

  // Serfs: frame = animationTable[animation][counter >> 3]; the frame's
  // sprite byte maps through the appearance tables to torso/head sprites.
  const animationTable = options.assets.serfAnimationTable;
  if (animationTable !== null && options.serfs !== undefined) {
    for (const serf of options.serfs) {
      const screen = mapTileToScreen(
        landscape,
        {
          column: serf.position % landscape.columns,
          row: Math.trunc(serf.position / landscape.columns),
        },
        { column: scrollColumn, row: scrollRow },
      );
      if (
        screen === null ||
        screen.x < -tileWidth ||
        screen.x > options.size.width + tileWidth ||
        screen.y < -2 * tileHeight ||
        screen.y > options.size.height + 2 * tileHeight
      ) {
        continue;
      }

      const animation = animationTable[serf.animation];
      if (animation === undefined || animation.length === 0) {
        continue;
      }

      const phase = Math.min(Math.max(serf.counter, 0) >> 3, animation.length - 1);
      const frame = animation[phase]!;
      const mapping = serfBodyAndHead(frame.sprite);
      if (mapping === null) {
        continue;
      }

      const anchorX = screen.x + frame.x;
      const anchorY = screen.y + frame.y;
      pushSprite("markers", `serft:${mapping.body}`, anchorX, anchorY, anchorY + 1, anchorX);
      if (mapping.head >= 0) {
        pushSprite("markers", `serfh:${mapping.head}`, anchorX, anchorY, anchorY + 2, anchorX);
      }
    }
  }

  for (const structure of options.builtStructures ?? []) {
    const screen = mapTileToScreen(landscape, structure.tile, { column: scrollColumn, row: scrollRow });
    if (
      screen === null ||
      screen.x < -tileWidth ||
      screen.x > options.size.width + tileWidth ||
      screen.y < -2 * tileHeight ||
      screen.y > options.size.height + 2 * tileHeight
    ) {
      continue;
    }

    pushSprite("shadows", "objshadow:flag", screen.x, screen.y, screen.y, screen.x);
    pushSprite("markers", "obj:flag", screen.x, screen.y, screen.y + structure.id / 1000, screen.x);
  }

  // UI chrome overlay (SB-16-01 foundation): decoded font text, an icon,
  // a popup frame piece, and the cursor at 2x integer scale, in screen
  // space above the map (the panel bar and popups build on this layer).
  const uiScale = uiScaleFor(options.size, options.pixelRatio ?? 1);
  if (atlas.regions["uif:0"] !== undefined && options.world !== undefined) {
    const inventory = options.world.inventoryForPlayer(0);
    const plankCount = inventory === null ? 0 : inventory.resources[7];
    const stoneCount = inventory === null ? 0 : inventory.resources[9];
    const hudText = `PLANK:${plankCount} STONE:${stoneCount}`;
    pushUiText(sprites, atlas, hudText, 30 * uiScale, 6 * uiScale, uiScale);

    pushUiSprite(sprites, atlas, "uii:0", 6 * uiScale, 2 * uiScale, uiScale);
    pushUiSprite(
      sprites, atlas, "uic",
      options.size.width - 20 * uiScale, 2 * uiScale, uiScale,
    );
  }

  // The authentic panel bar (SB-16-02): frame_bottom background pieces
  // and the five panel_button slots, docked bottom-center.
  if (options.panel !== undefined && atlas.regions["uip:0"] !== undefined) {
    const rect = panelBarRect(options.size, uiScale);
    for (const [pieceIndex, pieceX, pieceY] of panelBackgroundLayout) {
      pushUiSprite(
        sprites, atlas, `uifb:${pieceIndex}`,
        rect.x + pieceX * uiScale, rect.y + pieceY * uiScale, uiScale,
      );
    }

    options.panel.buttons.forEach((buttonSprite, slot) => {
      pushUiSprite(
        sprites, atlas, `uip:${buttonSprite}`,
        rect.x + (64 + slot * 48) * uiScale, rect.y + 4 * uiScale, uiScale,
      );
    });
  }

  // The popup system (SB-16-03): a 144x160 box with a tiled background
  // pattern, frame_popup borders, and the reference content layouts.
  if (options.popup !== undefined && options.world !== undefined) {
    const rect = popupRect(options.size, uiScale);
    const pushPopupText = (text: string, x: number, y: number): void => {
      pushUiText(sprites, atlas, text, rect.x + x * uiScale, rect.y + y * uiScale, uiScale);
    };

    // Interior: the DiagonalGreen 16x16 pattern tiled over the 128x144
    // content area between the borders.
    for (let tileY = 0; tileY < popupInterior.height; tileY += 16) {
      for (let tileX = 0; tileX < popupInterior.width; tileX += 16) {
        pushUiSprite(
          sprites, atlas, `uii:${popupBackgroundIcon}`,
          rect.x + (popupInterior.x + tileX) * uiScale,
          rect.y + (popupInterior.y + tileY) * uiScale,
          uiScale,
        );
      }
    }

    // The four frame_popup border pieces (UI/Box.cs type-1 layout); the
    // 144-tall side sprites fit the 160-tall popup exactly.
    for (const piece of popupBorderLayout(popupWidth, popupHeight)) {
      pushUiSprite(
        sprites, atlas, `uifr:${piece.sprite}`,
        rect.x + piece.x * uiScale, rect.y + piece.y * uiScale, uiScale,
      );
    }

    const kind = options.popup.kind;
    if (kind.startsWith("build")) {
      for (const item of buildPopupPages[kind] ?? []) {
        const key =
          item.building === "flag" ? "obj:flag" : `mo:${mapBuildingSprite[item.building]}`;
        pushUiSprite(
          sprites, atlas, key,
          rect.x + item.x * uiScale, rect.y + item.y * uiScale, uiScale,
        );
      }

      // The flip button cycles the pages.
      pushUiSprite(
        sprites, atlas, "uii:60",
        rect.x + popupFlipButton.x * uiScale, rect.y + popupFlipButton.y * uiScale, uiScale,
      );
    } else if (kind === "stats") {
      const inventory = options.world.inventoryForPlayer(0);
      for (const entry of resourceStatsLayout) {
        pushUiSprite(
          sprites, atlas, `uii:${entry.icon}`,
          rect.x + entry.iconX * uiScale, rect.y + entry.iconY * uiScale, uiScale,
        );
        const count = inventory === null ? 0 : (inventory.resources[entry.resource] ?? 0);
        pushPopupText(String(count), entry.countX, entry.countY);
      }
    } else if (kind === "sett") {
      const player = options.world.players[0];
      pushPopupText("KNIGHTS", 8, 8);
      settOccupationRows.forEach((row, threat) => {
        const occupation = player?.knightOccupation[threat] ?? 0;
        const maxLevel = (occupation >> 4) & 0xf;
        pushPopupText(`THREAT ${threat} LEVEL ${maxLevel}`, 8, row.y);
      });
      pushPopupText(`MORALE ${player?.knightMorale ?? 0}`, 8, 132);
      const audio = options.audio;
      pushPopupText(
        `SFX ${audio?.sfxMuted === true ? "OFF" : "ON"} MUSIC ${audio?.musicMuted === true ? "OFF" : "ON"}`,
        8,
        settAudioRowY,
      );
    } else if (kind === "map") {
      // The minimap: one colored pixel block per map tile (the reference
      // terrain palette), with the viewport marked; drawn as color
      // primitives above the popup chrome.
      const world = options.world;
      const fieldX = rect.x + minimapInterior.x * uiScale;
      const fieldY = rect.y + minimapInterior.y * uiScale;
      const pixelWidth = (minimapInterior.width * uiScale) / world.columns;
      const pixelHeight = (minimapInterior.height * uiScale) / world.rows;
      const pushQuad = (
        x: number,
        y: number,
        width: number,
        height: number,
        color: readonly [number, number, number, number],
      ): void => {
        const corners: [MapPoint, MapPoint, MapPoint, MapPoint] = [
          { x, y },
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height },
        ];
        primitives.push(
          {
            layer: "ui",
            points: [corners[0], corners[1], corners[2]],
            color,
            assetRole: "ui.minimap",
            sortY: y,
            sortX: x,
          },
          {
            layer: "ui",
            points: [corners[0], corners[2], corners[3]],
            color,
            assetRole: "ui.minimap",
            sortY: y,
            sortX: x,
          },
        );
      };

      for (let row = 0; row < world.rows; row += 1) {
        for (let column = 0; column < world.columns; column += 1) {
          const position = landscapePosition(world, column, row);
          const terrain = world.typesUp[position]!;
          const base = minimapTerrainColors[terrain] ?? [0, 0, 0];
          let color: [number, number, number, number] = [
            base[0] / 255,
            base[1] / 255,
            base[2] / 255,
            1,
          ];
          if (world.owners[position]! >= 0) {
            // Owned land brightens toward the player tint.
            color = [
              Math.min(1, color[0] * 0.6 + 0.4),
              color[1] * 0.8,
              color[2] * 0.8,
              1,
            ];
          }

          pushQuad(
            fieldX + column * pixelWidth,
            fieldY + row * pixelHeight,
            Math.ceil(pixelWidth),
            Math.ceil(pixelHeight),
            color,
          );
        }
      }

      // Viewport marker at the current scroll position.
      pushQuad(
        fieldX + scrollColumn * pixelWidth,
        fieldY + scrollRow * pixelHeight,
        Math.max(2, pixelWidth * 8),
        Math.max(2, pixelHeight * 5),
        [1, 1, 1, 0.45],
      );
    }
  }

  // Notification banner: events surface in the game font, top center.
  if (options.notice !== undefined && atlas.regions["uif:0"] !== undefined) {
    const noticeWidth = options.notice.length * 8 * uiScale;
    const noticeX = Math.max(0, Math.floor((options.size.width - noticeWidth) / 2));
    pushUiText(sprites, atlas, options.notice, noticeX, 18 * uiScale, uiScale);
  }

  const sortedSprites = sprites.sort(compareLandscapeSprite);

  return {
    renderer: "webgl2",
    mapSize: landscape.size,
    virtualSize: options.size,
    layers: renderLayerOrder.map((key, order) => ({
      key,
      order,
      primitiveCount: sortedSprites.filter((sprite) => sprite.layer === key).length,
    })),
    primitives,
    sprites: sortedSprites,
    atlas,
    tilePrimitiveCount: sortedSprites.filter((sprite) => sprite.layer === "terrain").length,
    assetSummary: {
      source: "dos-pa-decoded",
      definedArchiveEntries: options.definedArchiveEntries ?? null,
      mapGroundStatus: `landscape:${options.assets.terrainComboCount}`,
      pathGroundStatus: "deferred",
      mapObjectsStatus: `landscape:${options.assets.objectSpriteCount}`,
      mapShadowsStatus: "landscape",
    },
  };
}

function pushUiSprite(
  sprites: RenderSpritePrimitive[],
  atlas: SpriteAtlas,
  key: string,
  x: number,
  y: number,
  scale: number,
): void {
  if (atlas.regions[key] === undefined) {
    return;
  }

  sprites.push({ layer: "ui", key, x, y, sortY: y, sortX: x, scale });
}

// Game text draws like the original: the black font-shadow glyph first,
// the colored font glyph on top at the same position.
function pushUiText(
  sprites: RenderSpritePrimitive[],
  atlas: SpriteAtlas,
  text: string,
  x: number,
  y: number,
  scale: number,
): void {
  for (const placement of layoutUiText(text)) {
    const glyphX = x + placement.x * scale;
    pushUiSprite(sprites, atlas, `uifs:${placement.glyphIndex}`, glyphX, y, scale);
    pushUiSprite(sprites, atlas, `uif:${placement.glyphIndex}`, glyphX, y, scale);
  }
}

function compareLandscapeSprite(
  left: RenderSpritePrimitive,
  right: RenderSpritePrimitive,
): number {
  const layerDelta = renderLayerOrder.indexOf(left.layer) - renderLayerOrder.indexOf(right.layer);
  if (layerDelta !== 0) {
    return layerDelta;
  }

  const yDelta = left.sortY - right.sortY;
  if (yDelta !== 0) {
    return yDelta;
  }

  return left.sortX - right.sortX;
}

export function mapTileToScreen(
  landscape: ClassicMapLandscape,
  tile: { readonly column: number; readonly row: number },
  scroll: MapScroll,
): { x: number; y: number } | null {
  const r = wrap(tile.row - scroll.row, landscape.rows);
  const columnShift = (r + (r & 1)) >> 1;
  const c = wrap(tile.column - scroll.column - columnShift, landscape.columns);
  const position = landscapePosition(landscape, tile.column, tile.row);
  const height = landscape.heights[position]!;

  return {
    x: c * tileWidth + ((r & 1) === 1 ? tileWidth / 2 : 0),
    y: r * tileHeight - heightStep * height,
  };
}

// Screen position to map tile, ignoring terrain height lift (recorded
// simplification; height-aware picking follows with the original
// CoordinateSpace port).
export function screenToMapTile(
  landscape: ClassicMapLandscape,
  screen: { readonly x: number; readonly y: number },
  scroll: MapScroll,
  viewScale = 1,
): { column: number; row: number; position: number } {
  const mapX = screen.x / viewScale;
  const mapY = screen.y / viewScale;
  const r = Math.floor(mapY / tileHeight);
  const stagger = (r & 1) === 1 ? tileWidth / 2 : 0;
  const c = Math.round((mapX - stagger) / tileWidth);
  const columnShift = (r + (r & 1)) >> 1;
  const column = wrap(scroll.column + c + columnShift, landscape.columns);
  const row = wrap(scroll.row + r, landscape.rows);

  return {
    column,
    row,
    position: row * landscape.columns + column,
  };
}
