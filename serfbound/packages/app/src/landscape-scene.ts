import {
  buildSpriteAtlas,
  composeMaskedTile,
  terrainGroundSpriteIndex,
  triangleMaskCodeDown,
  triangleMaskCodeUp,
  type DecodedDosSprite,
  type SpriteAtlas,
} from "@serfbound/assets";
import type {
  ClassicMapLandscape,
  RenderSize,
  SerfboundBuiltStructure,
} from "@serfbound/engine";
import {
  renderLayerOrder,
  type DecodedRenderAssets,
  type FirstRenderLayerScene,
  type RenderLayerKey,
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
};

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

  return {
    atlas: buildSpriteAtlas(sprites),
    landscape,
    terrainComboCount,
    objectSpriteCount,
  };
}

export type LandscapeSceneOptions = {
  readonly size: RenderSize;
  readonly assets: LandscapeRenderAssets;
  readonly scroll: MapScroll;
  readonly builtStructures?: readonly SerfboundBuiltStructure[];
  readonly definedArchiveEntries?: number;
};

export function createLandscapeScene(options: LandscapeSceneOptions): FirstRenderLayerScene {
  const { atlas, landscape } = options.assets;
  const scrollColumn = wrap(Math.trunc(options.scroll.column), landscape.columns);
  const scrollRow = wrap(Math.trunc(options.scroll.row), landscape.rows);
  const sprites: RenderSpritePrimitive[] = [];

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
      x: anchorX + region.offsetX,
      y: anchorY + region.offsetY,
      sortY,
      sortX,
    });
  };

  const latticeColumns = Math.ceil(options.size.width / tileWidth) + extraColumns;
  const latticeRows = Math.ceil(options.size.height / tileHeight) + extraRowsBelow;

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
    primitives: [],
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
): { column: number; row: number; position: number } {
  const r = Math.floor(screen.y / tileHeight);
  const stagger = (r & 1) === 1 ? tileWidth / 2 : 0;
  const c = Math.round((screen.x - stagger) / tileWidth);
  const columnShift = (r + (r & 1)) >> 1;
  const column = wrap(scroll.column + c + columnShift, landscape.columns);
  const row = wrap(scroll.row + r, landscape.rows);

  return {
    column,
    row,
    position: row * landscape.columns + column,
  };
}
