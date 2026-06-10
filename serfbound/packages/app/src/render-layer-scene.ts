import {
  DosPaArchive,
  buildSpriteAtlas,
  composeMaskedTile,
  composeSerfTorso,
  decodeDosResourceSprite,
  decodeUiCursor,
  decodeUiFontGlyph,
  decodeUiFontShadowGlyph,
  decodeUiFrame,
  decodeUiIcon,
  decodeSfxSamples,
  decodeUiLogo,
  parseXmiTrack,
  decodeUiPanelButton,
  layoutUiText,
  sfxType,
  parseSerfAnimationTable,
  type XmiEvent,
  uiFontGlyphCount,
  type ComposedSerfTorso,
  type SerfAnimationTable,
  terrainGroundSpriteIndex,
  triangleMaskCodeDown,
  triangleMaskCodeUp,
  type DecodedDosSprite,
  type DosPaCatalog,
  type SpriteAtlas,
  type TypedAssetCatalog,
  type TypedAssetResource,
} from "@serfbound/assets";
import { uiScaleFor } from "./panel-bar.js";
import { initBoxHeight, initBoxWidth } from "./init-screen.js";
import { popupBorderLayout, popupBorderSize } from "./popup.js";
import {
  MapGeometry,
  MapProjectionTransform,
  type SerfboundBuiltStructure,
  type MapHeightProvider,
  type MapPoint,
  type MapTile,
  type RenderSize,
} from "@serfbound/engine";

export const renderLayerOrder = ["terrain", "paths", "shadows", "objects", "markers", "ui"] as const;

export type RenderLayerKey = (typeof renderLayerOrder)[number];

export type RenderSceneSource = "generated-fixture" | "dos-pa-catalog" | "dos-pa-decoded";

export type RenderSpritePrimitive = {
  readonly layer: RenderLayerKey;
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly sortY: number;
  readonly sortX: number;
  // Integer pixel-art scale (UI chrome renders at 2x; map sprites at 1x).
  readonly scale?: number;
};

export type DecodedMapObjectSprite = {
  readonly sprite: DecodedDosSprite;
  readonly shadow: DecodedDosSprite | null;
};

export type DecodedRenderAssets = {
  readonly source: "dos-pa-decoded";
  readonly atlas: SpriteAtlas;
  readonly terrainTriangleCount: number;
  readonly objectKeys: readonly string[];
  readonly definedArchiveEntries: number;
  // Raw decoded sprites for landscape-specific composition (SB-11-04/05).
  readonly rawGrounds: readonly (DecodedDosSprite | null)[];
  readonly rawMasksUp: readonly (DecodedDosSprite | null)[];
  readonly rawMasksDown: readonly (DecodedDosSprite | null)[];
  readonly rawMapObjects: ReadonlyMap<number, DecodedMapObjectSprite>;
  readonly rawWaves: readonly (DecodedDosSprite | null)[];
  readonly rawPathGrounds: readonly (DecodedDosSprite | null)[];
  readonly rawPathMasks: readonly (DecodedDosSprite | null)[];
  readonly rawBorders: readonly (DecodedDosSprite | null)[];
  readonly serfAnimationTable: SerfAnimationTable | null;
  readonly rawSerfTorsos: ReadonlyMap<number, ComposedSerfTorso>;
  readonly rawSerfHeads: ReadonlyMap<number, DecodedDosSprite>;
  // Decoded UI chrome (SB-16-01): font glyphs, icon sheet, panel buttons,
  // popup frame pieces, and the cursor.
  readonly rawFontGlyphs: readonly (DecodedDosSprite | null)[];
  // The black-tinted font-shadow set drawn under every glyph (SB-21-02).
  readonly rawFontShadows: readonly (DecodedDosSprite | null)[];
  readonly rawIcons: ReadonlyMap<number, DecodedDosSprite>;
  readonly rawPanelButtons: ReadonlyMap<number, DecodedDosSprite>;
  readonly rawPopupFrames: readonly (DecodedDosSprite | null)[];
  readonly rawBottomFrames: readonly (DecodedDosSprite | null)[];
  readonly rawCursor: DecodedDosSprite | null;
  readonly rawLogo: DecodedDosSprite | null;
  // Decoded DOS sound effects (SB-17-01), PCM16 by clip id.
  readonly rawSfx: ReadonlyMap<number, Int16Array>;
  // Parsed XMI music events for track 0 (SB-17-02).
  readonly rawMusic: XmiEvent[] | null;
};

export type RenderColor = readonly [number, number, number, number];

export type RenderScenePrimitive = {
  readonly layer: RenderLayerKey;
  readonly points: readonly [MapPoint, MapPoint, MapPoint];
  readonly color: RenderColor;
  readonly assetRole: string;
  readonly sortY: number;
  readonly sortX: number;
};

export type RenderSceneLayer = {
  readonly key: RenderLayerKey;
  readonly order: number;
  readonly primitiveCount: number;
};

export type RenderSceneAssetSummary = {
  readonly source: RenderSceneSource;
  readonly definedArchiveEntries: number | null;
  readonly mapGroundStatus: string;
  readonly pathGroundStatus: string;
  readonly mapObjectsStatus: string;
  readonly mapShadowsStatus: string;
};

export type FirstRenderLayerSceneOptions = {
  readonly size?: RenderSize;
  readonly typedAssetCatalog?: TypedAssetCatalog;
  readonly decodedAssets?: DecodedRenderAssets;
  readonly builtStructures?: readonly SerfboundBuiltStructure[];
  // The authentic game start screen drawn over the import preview
  // (SB-16-05): seed, supplies, map size, start.
  readonly initScreen?: {
    readonly seedString: string;
    readonly initialSupplies: number;
    readonly mapSize: number;
    readonly mission?: string;
  };
  // Device pixel ratio backing the canvas (SB-21-03): the decoded
  // preview map and the UI chrome scale up so high-DPI backing stores
  // keep their apparent CSS size, rendered sharp.
  readonly pixelRatio?: number;
};

export type PointerMapInteraction = {
  readonly screen: MapPoint;
  readonly view: MapPoint;
  readonly map: MapPoint;
  readonly tile: MapTile;
};

export type FirstRenderLayerScene = {
  readonly renderer: "webgl2";
  readonly mapSize: number;
  readonly virtualSize: RenderSize;
  readonly layers: readonly RenderSceneLayer[];
  readonly primitives: readonly RenderScenePrimitive[];
  readonly sprites: readonly RenderSpritePrimitive[];
  readonly atlas: SpriteAtlas | null;
  readonly tilePrimitiveCount: number;
  readonly assetSummary: RenderSceneAssetSummary;
};

const defaultSceneSize = { width: 960, height: 540 } as const;
const sceneProjectionOptions = {
  mapSize: 3,
  scrollX: 3,
  scrollY: 2,
  tileWidth: 32,
  tileHeight: 20,
} as const;
const terrainColors = [
  [0.2, 0.42, 0.3, 1],
  [0.3, 0.5, 0.33, 1],
  [0.46, 0.55, 0.31, 1],
  [0.52, 0.45, 0.24, 1],
  [0.25, 0.43, 0.43, 1],
] as const satisfies readonly RenderColor[];

export function createFirstRenderLayerScene(
  options: FirstRenderLayerSceneOptions = {},
): FirstRenderLayerScene {
  const virtualSize = options.size ?? defaultSceneSize;
  if (options.decodedAssets !== undefined) {
    return createDecodedRenderScene(
      virtualSize,
      options.decodedAssets,
      options.builtStructures ?? [],
      options.initScreen,
      options.pixelRatio ?? 1,
    );
  }

  const { geometry, transform, heightProvider } = createSceneProjection(virtualSize);
  const primitives: RenderScenePrimitive[] = [];

  for (let row = 0; row < 25; row += 1) {
    for (let column = 0; column < 31; column += 1) {
      const tile = geometry.tileAt(column, row);
      const top = transform.tileToScreen(tile.position, heightProvider);
      if (top.x < -64 || top.x > virtualSize.width + 64 || top.y < -40 || top.y > virtualSize.height + 40) {
        continue;
      }

      const height = heightProvider(tile);
      const terrainIndex = (column * 3 + row * 5 + height) % terrainColors.length;
      const color = terrainColors[terrainIndex] ?? terrainColors[0];
      const centerY = top.y + 10;

      primitives.push(...diamondTriangles({
        layer: "terrain",
        top,
        width: 32,
        height: 20,
        color,
        assetRole: "renderer.mapGround",
        sortY: centerY,
        sortX: top.x,
      }));

      if ((column + row) % 7 === 0) {
        primitives.push(...pathTriangles(top, column, row));
      }

      if ((column * 5 + row * 3) % 29 === 0) {
        primitives.push(...objectTriangles(top, column, row));
      }
    }
  }

  for (const structure of options.builtStructures ?? []) {
    const top = transform.tileToScreen(structure.tile.position, heightProvider);
    if (top.x < -64 || top.x > virtualSize.width + 64 || top.y < -64 || top.y > virtualSize.height + 64) {
      continue;
    }

    primitives.push(...builtFlagTriangles(top, structure.id));
  }

  const sortedPrimitives = primitives.sort(comparePrimitive);

  return {
    renderer: "webgl2",
    mapSize: geometry.size,
    virtualSize,
    layers: renderLayerOrder.map((key, order) => ({
      key,
      order,
      primitiveCount: sortedPrimitives.filter((primitive) => primitive.layer === key).length,
    })),
    primitives: sortedPrimitives,
    sprites: [],
    atlas: null,
    tilePrimitiveCount: sortedPrimitives.filter((primitive) => primitive.layer === "terrain").length,
    assetSummary: summarizeSceneAssets(options.typedAssetCatalog),
  };
}

export function resolveFirstRenderLayerPointer(
  screen: MapPoint,
  size: RenderSize = defaultSceneSize,
): PointerMapInteraction {
  const { geometry, transform, heightProvider } = createSceneProjection(size);
  const view = transform.screenToView(screen);
  const map = transform.viewToMap(view);
  const tile = geometry.tileFromPosition(transform.viewToTile(view, heightProvider));

  return { screen, view, map, tile };
}

export function renderFirstRenderLayerScene(
  canvas: HTMLCanvasElement,
  scene: FirstRenderLayerScene,
): void {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });

  if (gl === null) {
    throw new Error("Serfbound first render-layer scene requires WebGL2.");
  }

  if (scene.atlas !== null && scene.sprites.length > 0) {
    renderDecodedSpriteScene(gl, canvas, scene, scene.atlas);
    // Color primitives draw above the sprites (the minimap overlay).
    if (scene.primitives.length > 0) {
      renderColorPrimitives(gl, canvas, scene, false);
    }

    return;
  }

  renderColorPrimitives(gl, canvas, scene, true);
}

function renderColorPrimitives(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  scene: FirstRenderLayerScene,
  clear: boolean,
): void {
  const program = createProgram(gl);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const colorLocation = gl.getAttribLocation(program, "a_color");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  if (positionLocation < 0 || colorLocation < 0 || resolutionLocation === null) {
    throw new Error("Serfbound WebGL2 scene shader locations are unavailable.");
  }

  const vertices = new Float32Array(scene.primitives.length * 3 * 6);
  let offset = 0;
  for (const primitive of scene.primitives) {
    for (const point of primitive.points) {
      vertices[offset] = point.x;
      vertices[offset + 1] = point.y;
      vertices[offset + 2] = primitive.color[0];
      vertices[offset + 3] = primitive.color[1];
      vertices[offset + 4] = primitive.color[2];
      vertices[offset + 5] = primitive.color[3];
      offset += 6;
    }
  }

  const buffer = gl.createBuffer();
  if (buffer === null) {
    throw new Error("Serfbound WebGL2 scene could not allocate a vertex buffer.");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  if (clear) {
    gl.clearColor(0.07, 0.1, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  gl.useProgram(program);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 24, 8);
  gl.drawArrays(gl.TRIANGLES, 0, scene.primitives.length * 3);
  gl.deleteBuffer(buffer);
}

// ---------------------------------------------------------------------------
// Decoded-asset scene: authentic terrain triangles, objects, and flags from
// imported DOS sprite data. Placement follows Freeserf.Core/Render/RenderMap:
// every triangle draws at X = apexX - 16, Y = 20*apexRow - 4*apexHeight plus
// the mask sprite's header offset.
// ---------------------------------------------------------------------------

const decodedTileWidth = 32;
const decodedTileHeight = 20;
const decodedHeightStep = 4;
// Atlas combos are collected over a fixed lattice large enough for any
// realistic canvas; scenes beyond it skip unknown combos gracefully.
const decodedFieldColumns = 84;
const decodedFieldRows = 104;
const fieldWavePeriod = 12;
const fieldHeightSteps = [0, 0, 1, 2, 3, 3, 3] as const;
const fieldCrossWavePeriod = 17;
const fieldCrossHeightSteps = [0, 0, 0, 1, 1, 2, 2, 1, 1] as const;

const decodedObjectSprites = [
  { kind: "tree", spriteIndex: 0 },
  { kind: "pine", spriteIndex: 8 },
  { kind: "stone", spriteIndex: 64 },
] as const;
const decodedFlagSpriteIndex = 128;

type LatticeVertex = { readonly column: number; readonly row: number };

function wrapValue(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function fieldWave(value: number, period: number): number {
  const phase = wrapValue(value, period);
  return Math.min(phase, period - phase);
}

// Two crossed triangle waves give a 2D rolling field. Per-lattice-step height
// deltas stay small, and the rare steeper combination falls back to a clamped
// mask code so terrain never leaves holes.
function fieldHeight(column: number, row: number): number {
  const ridge = fieldHeightSteps[fieldWave(column + (row >> 1), fieldWavePeriod)] ?? 0;
  const cross = fieldCrossHeightSteps[fieldWave(column - row, fieldCrossWavePeriod)] ?? 0;
  return ridge + cross;
}

function vertexScreenX(column: number, row: number): number {
  return column * decodedTileWidth + (row & 1) * (decodedTileWidth / 2);
}

function downLeft(column: number, row: number): LatticeVertex {
  return { column: (row & 1) === 0 ? column - 1 : column, row: row + 1 };
}

function downRight(column: number, row: number): LatticeVertex {
  return { column: (row & 1) === 0 ? column : column + 1, row: row + 1 };
}

function upLeft(column: number, row: number): LatticeVertex {
  return { column: (row & 1) === 0 ? column - 1 : column, row: row - 1 };
}

function upRight(column: number, row: number): LatticeVertex {
  return { column: (row & 1) === 0 ? column : column + 1, row: row - 1 };
}

function fieldTerrain(column: number, row: number, heights: readonly number[]): number {
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  if (max === 0) {
    return 0; // water
  }

  if (min >= 4) {
    return 14; // snow
  }

  if (max >= 4) {
    return 11; // tundra
  }

  if (min >= 1 && wrapValue(column + row * 2, 37) < 5) {
    return 8; // desert patch
  }

  return 5; // grass
}

function fieldObjectKind(
  column: number,
  row: number,
  terrain: number,
  apexHeight: number,
): string | null {
  if (terrain !== 5 || apexHeight === 0) {
    return null;
  }

  const hash = wrapValue(column * 13 + row * 7, 41);
  if (hash === 0) {
    return "tree";
  }

  if (hash === 11) {
    return "pine";
  }

  if (hash === 23) {
    return "stone";
  }

  return null;
}

type DecodedTriangle = {
  readonly orientation: "up" | "down";
  readonly terrain: number;
  readonly maskCode: number;
};

function decodedTriangleUp(column: number, row: number): DecodedTriangle | null {
  const apexHeight = fieldHeight(column, row);
  const left = downLeft(column, row);
  const right = downRight(column, row);
  const leftHeight = fieldHeight(left.column, left.row);
  const rightHeight = fieldHeight(right.column, right.row);
  const maskCode =
    triangleMaskCodeUp(apexHeight, leftHeight, rightHeight) ??
    triangleMaskCodeUp(
      apexHeight,
      clampNeighborHeight(apexHeight, leftHeight),
      clampNeighborHeight(apexHeight, rightHeight),
    );
  if (maskCode === null) {
    return null;
  }

  return {
    orientation: "up",
    terrain: fieldTerrain(column, row, [apexHeight, leftHeight, rightHeight]),
    maskCode,
  };
}

function clampNeighborHeight(apexHeight: number, neighborHeight: number): number {
  return apexHeight + Math.max(-2, Math.min(2, neighborHeight - apexHeight));
}

function decodedTriangleDown(column: number, row: number): DecodedTriangle | null {
  const apexHeight = fieldHeight(column, row);
  const left = upLeft(column, row);
  const right = upRight(column, row);
  const leftHeight = fieldHeight(left.column, left.row);
  const rightHeight = fieldHeight(right.column, right.row);
  const maskCode =
    triangleMaskCodeDown(apexHeight, leftHeight, rightHeight) ??
    triangleMaskCodeDown(
      apexHeight,
      clampNeighborHeight(apexHeight, leftHeight),
      clampNeighborHeight(apexHeight, rightHeight),
    );
  if (maskCode === null) {
    return null;
  }

  return {
    orientation: "down",
    terrain: fieldTerrain(column, row, [apexHeight, leftHeight, rightHeight]),
    maskCode,
  };
}

function terrainComboKey(triangle: DecodedTriangle): string {
  return `t${triangle.orientation === "up" ? "u" : "d"}:${triangle.terrain}:${triangle.maskCode}`;
}

export function buildDecodedRenderAssets(
  bytes: ArrayBuffer | ArrayBufferView,
  catalog?: DosPaCatalog,
): DecodedRenderAssets | null {
  let archive: DosPaArchive;
  try {
    archive = catalog === undefined ? new DosPaArchive(bytes) : new DosPaArchive(bytes, catalog);
  } catch {
    return null;
  }

  if (archive.getPalette(3) === null) {
    return null;
  }

  const groundCache = new Map<number, DecodedDosSprite | null>();
  const maskCache = new Map<string, DecodedDosSprite | null>();
  const decodeGround = (groundIndex: number): DecodedDosSprite | null => {
    let ground = groundCache.get(groundIndex);
    if (ground === undefined) {
      ground = decodeSafely(archive, "map_ground", groundIndex);
      groundCache.set(groundIndex, ground);
    }

    return ground;
  };
  const decodeMask = (orientation: "up" | "down", maskCode: number): DecodedDosSprite | null => {
    const cacheKey = `${orientation}:${maskCode}`;
    let mask = maskCache.get(cacheKey);
    if (mask === undefined) {
      mask = decodeSafely(
        archive,
        orientation === "up" ? "map_mask_up" : "map_mask_down",
        maskCode,
      );
      maskCache.set(cacheKey, mask);
    }

    return mask;
  };

  const sprites: Record<string, DecodedDosSprite> = {};
  let terrainTriangleCount = 0;

  for (let row = -4; row <= decodedFieldRows; row += 1) {
    for (let column = -2; column <= decodedFieldColumns; column += 1) {
      for (const triangle of [decodedTriangleUp(column, row), decodedTriangleDown(column, row)]) {
        if (triangle === null) {
          continue;
        }

        const key = terrainComboKey(triangle);
        if (sprites[key] !== undefined) {
          continue;
        }

        const groundIndex = terrainGroundSpriteIndex(
          triangle.terrain,
          triangle.maskCode,
          triangle.orientation,
        );
        const ground = decodeGround(groundIndex);
        const mask = decodeMask(triangle.orientation, triangle.maskCode);
        if (ground === null || mask === null) {
          continue;
        }

        sprites[key] = composeMaskedTile(ground, mask);
        terrainTriangleCount += 1;
      }
    }
  }

  if (terrainTriangleCount === 0) {
    return null;
  }

  const objectKeys: string[] = [];
  const objectEntries = [
    ...decodedObjectSprites,
    { kind: "flag", spriteIndex: decodedFlagSpriteIndex } as const,
  ];
  for (const { kind, spriteIndex } of objectEntries) {
    const object = decodeSafely(archive, "map_object", spriteIndex);
    if (object === null) {
      continue;
    }

    sprites[`obj:${kind}`] = object;
    objectKeys.push(`obj:${kind}`);

    const shadow = decodeSafely(archive, "map_shadow", spriteIndex);
    if (shadow !== null) {
      sprites[`objshadow:${kind}`] = shadow;
    }
  }

  // Raw sprite collections for landscape-specific atlas composition.
  const rawGrounds: (DecodedDosSprite | null)[] = [];
  for (let groundIndex = 0; groundIndex < 33; groundIndex += 1) {
    rawGrounds.push(decodeGround(groundIndex));
  }

  const rawMasksUp: (DecodedDosSprite | null)[] = [];
  const rawMasksDown: (DecodedDosSprite | null)[] = [];
  for (let maskCode = 0; maskCode < 81; maskCode += 1) {
    rawMasksUp.push(decodeMask("up", maskCode));
    rawMasksDown.push(decodeMask("down", maskCode));
  }

  // Map object sprites 0..192 cover generator objects (0..84), the flag
  // (128), and building sprites (0x98..0xc0 per RenderBuilding).
  const rawMapObjects = new Map<number, DecodedMapObjectSprite>();
  for (const spriteIndex of Array.from({ length: 193 }, (_, index) => index)) {
    const sprite = decodeSafely(archive, "map_object", spriteIndex);
    if (sprite === null) {
      continue;
    }

    rawMapObjects.set(spriteIndex, {
      sprite,
      shadow: decodeSafely(archive, "map_shadow", spriteIndex),
    });
  }

  const rawWaves: (DecodedDosSprite | null)[] = [];
  for (let waveIndex = 0; waveIndex < 16; waveIndex += 1) {
    rawWaves.push(decodeSafely(archive, "map_waves", waveIndex));
  }

  const rawPathGrounds: (DecodedDosSprite | null)[] = [];
  for (let groundIndex = 0; groundIndex < 10; groundIndex += 1) {
    rawPathGrounds.push(decodeSafely(archive, "path_ground", groundIndex));
  }

  const rawPathMasks: (DecodedDosSprite | null)[] = [];
  for (let maskIndex = 0; maskIndex < 27; maskIndex += 1) {
    rawPathMasks.push(decodeSafely(archive, "path_mask", maskIndex));
  }

  const rawBorders: (DecodedDosSprite | null)[] = [];
  for (let borderIndex = 0; borderIndex < 10; borderIndex += 1) {
    rawBorders.push(decodeSafely(archive, "map_border", borderIndex));
  }

  // Serf rendering data: the animation table, walking torso bodies (0..47),
  // and head sprites.
  let serfAnimationTable: SerfAnimationTable | null = null;
  try {
    serfAnimationTable = parseSerfAnimationTable(archive);
  } catch {
    serfAnimationTable = null;
  }

  const rawSerfTorsos = new Map<number, ComposedSerfTorso>();
  for (let body = 0; body < 48; body += 1) {
    try {
      const torso = composeSerfTorso(archive, body);
      if (torso !== null) {
        rawSerfTorsos.set(body, torso);
      }
    } catch {
      // partial archives skip missing bodies
    }
  }

  const rawSerfHeads = new Map<number, DecodedDosSprite>();
  for (let head = 0; head < 64; head += 1) {
    const sprite = decodeSafely(archive, "serf_head", head);
    if (sprite !== null) {
      rawSerfHeads.set(head, sprite);
    }
  }

  // UI chrome: the 44 font glyphs, icon sheet, panel buttons, popup
  // frames, and the cursor (partial archives skip what they lack).
  const rawFontGlyphs: (DecodedDosSprite | null)[] = [];
  const rawFontShadows: (DecodedDosSprite | null)[] = [];
  for (let glyph = 0; glyph < uiFontGlyphCount; glyph += 1) {
    rawFontGlyphs.push(decodeUiSafely(() => decodeUiFontGlyph(archive, glyph)));
    rawFontShadows.push(decodeUiSafely(() => decodeUiFontShadowGlyph(archive, glyph)));
  }

  const rawIcons = new Map<number, DecodedDosSprite>();
  for (let icon = 0; icon < 380; icon += 1) {
    const sprite = decodeUiSafely(() => decodeUiIcon(archive, icon));
    if (sprite !== null) {
      rawIcons.set(icon, sprite);
    }
  }

  const rawPanelButtons = new Map<number, DecodedDosSprite>();
  for (let button = 0; button < 30; button += 1) {
    const sprite = decodeUiSafely(() => decodeUiPanelButton(archive, button));
    if (sprite !== null) {
      rawPanelButtons.set(button, sprite);
    }
  }

  const rawPopupFrames: (DecodedDosSprite | null)[] = [];
  for (let frame = 0; frame < 10; frame += 1) {
    rawPopupFrames.push(decodeUiSafely(() => decodeUiFrame(archive, "framePopup", frame)));
  }

  const rawBottomFrames: (DecodedDosSprite | null)[] = [];
  for (let frame = 0; frame < 26; frame += 1) {
    rawBottomFrames.push(decodeUiSafely(() => decodeUiFrame(archive, "frameBottom", frame)));
  }

  const rawCursor = decodeUiSafely(() => decodeUiCursor(archive));
  const rawLogo = decodeUiSafely(() => decodeUiLogo(archive));

  // Music: parse XMI track 0 when the archive defines it.
  let rawMusic: XmiEvent[] | null = null;
  try {
    rawMusic = parseXmiTrack(archive, 0);
  } catch {
    rawMusic = null;
  }

  // Sound effects: decode every reference clip the archive defines.
  const rawSfx = new Map<number, Int16Array>();
  for (const sfxId of Object.values(sfxType)) {
    try {
      const samples = decodeSfxSamples(archive, sfxId);
      if (samples !== null) {
        rawSfx.set(sfxId, samples);
      }
    } catch {
      // partial archives skip missing clips
    }
  }

  // UI chrome for the pre-game scenes (the init screen draws over the
  // import preview, which uses this atlas directly).
  const zeroAnchored = (sprite: DecodedDosSprite): DecodedDosSprite => ({
    ...sprite,
    deltaX: 0,
    deltaY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const cropSpriteHeight = (sprite: DecodedDosSprite, height: number): DecodedDosSprite => {
    const rows = Math.min(height, sprite.height);
    return {
      ...sprite,
      height: rows,
      rgba: sprite.rgba.slice(0, sprite.width * rows * 4),
    };
  };
  rawFontGlyphs.forEach((glyph, index) => {
    if (glyph !== null) {
      sprites[`uif:${index}`] = zeroAnchored(glyph);
    }
  });
  rawFontShadows.forEach((glyph, index) => {
    if (glyph !== null) {
      sprites[`uifs:${index}`] = zeroAnchored(glyph);
    }
  });
  const backgroundPattern = rawIcons.get(310);
  if (backgroundPattern !== undefined) {
    sprites["uii:310"] = zeroAnchored(backgroundPattern);
  }

  // The four type-1 border pieces (UI/Box.cs): horizontals 0/1 as-is,
  // the 144-tall side pieces 2/3 cropped to the condensed init box's
  // interior height.
  const initSideHeight = initBoxHeight - popupBorderSize.top - popupBorderSize.bottom;
  rawPopupFrames.slice(0, 4).forEach((frame, index) => {
    if (frame !== null) {
      sprites[`uifr:${index}`] =
        index >= 2
          ? cropSpriteHeight(zeroAnchored(frame), initSideHeight)
          : zeroAnchored(frame);
    }
  });
  if (rawLogo !== null) {
    sprites["uilogo"] = zeroAnchored(rawLogo);
  }

  return {
    source: "dos-pa-decoded",
    atlas: buildSpriteAtlas(sprites),
    terrainTriangleCount,
    objectKeys,
    definedArchiveEntries: archive.catalog.entrySummary.defined,
    rawGrounds,
    rawMasksUp,
    rawMasksDown,
    rawMapObjects,
    rawWaves,
    rawPathGrounds,
    rawPathMasks,
    rawBorders,
    serfAnimationTable,
    rawSerfTorsos,
    rawSerfHeads,
    rawFontGlyphs,
    rawFontShadows,
    rawIcons,
    rawPanelButtons,
    rawPopupFrames,
    rawBottomFrames,
    rawCursor,
    rawLogo,
    rawSfx,
    rawMusic,
  };
}

function decodeUiSafely(decode: () => DecodedDosSprite | null): DecodedDosSprite | null {
  try {
    return decode();
  } catch {
    return null;
  }
}

function decodeSafely(
  archive: DosPaArchive,
  resourceName: string,
  spriteIndex: number,
): DecodedDosSprite | null {
  try {
    return decodeDosResourceSprite(archive, resourceName, spriteIndex);
  } catch {
    return null;
  }
}

function createDecodedRenderScene(
  virtualSize: RenderSize,
  decodedAssets: DecodedRenderAssets,
  builtStructures: readonly SerfboundBuiltStructure[],
  initScreen?: {
    readonly seedString: string;
    readonly initialSupplies: number;
    readonly mapSize: number;
    readonly mission?: string;
  },
  pixelRatio = 1,
): FirstRenderLayerScene {
  const { atlas } = decodedAssets;
  const sprites: RenderSpritePrimitive[] = [];
  // High-DPI backing stores scale the preview map by the integer pixel
  // ratio so the import preview keeps its apparent size, sharp.
  const previewScale = Math.max(1, Math.round(pixelRatio));
  const columns = Math.ceil(virtualSize.width / (decodedTileWidth * previewScale)) + 2;
  const rows = Math.ceil(virtualSize.height / (decodedTileHeight * previewScale)) + 4;

  const pushSprite = (
    layer: RenderLayerKey,
    key: string,
    anchorX: number,
    anchorY: number,
    sortY: number,
  ): void => {
    const region = atlas.regions[key];
    if (region === undefined) {
      return;
    }

    sprites.push({
      layer,
      key,
      x: (anchorX + region.offsetX) * previewScale,
      y: (anchorY + region.offsetY) * previewScale,
      sortY,
      sortX: anchorX,
      ...(previewScale === 1 ? {} : { scale: previewScale }),
    });
  };

  for (let row = -2; row <= rows; row += 1) {
    for (let column = -1; column <= columns; column += 1) {
      const apexHeight = fieldHeight(column, row);
      const apexX = vertexScreenX(column, row);
      const apexY = row * decodedTileHeight - decodedHeightStep * apexHeight;

      const up = decodedTriangleUp(column, row);
      if (up !== null) {
        pushSprite("terrain", terrainComboKey(up), apexX - decodedTileWidth / 2, apexY, apexY);
      }

      const down = decodedTriangleDown(column, row);
      if (down !== null) {
        pushSprite("terrain", terrainComboKey(down), apexX - decodedTileWidth / 2, apexY, apexY);
      }

      const objectKind =
        up === null ? null : fieldObjectKind(column, row, up.terrain, apexHeight);
      if (objectKind !== null) {
        pushSprite("shadows", `objshadow:${objectKind}`, apexX, apexY, apexY);
        pushSprite("objects", `obj:${objectKind}`, apexX, apexY, apexY);
      }
    }
  }

  const { transform, heightProvider } = createSceneProjection({
    width: virtualSize.width / previewScale,
    height: virtualSize.height / previewScale,
  });
  for (const structure of builtStructures) {
    const top = transform.tileToScreen(structure.tile.position, heightProvider);
    const anchorX = top.x;
    const anchorY = top.y + 16;
    pushSprite("shadows", "objshadow:flag", anchorX, anchorY, anchorY);
    pushSprite("markers", "obj:flag", anchorX, anchorY, anchorY + structure.id / 1000);
  }

  // The game start screen (SB-16-05): the GameInitBox condensed to the
  // options the engine supports, drawn from decoded art at 2x.
  if (initScreen !== undefined && atlas.regions["uif:0"] !== undefined) {
    const scale = uiScaleFor(virtualSize, pixelRatio);
    const boxWidth = 144 * scale;
    const boxHeight = 128 * scale;
    const boxX = Math.max(0, Math.floor((virtualSize.width - boxWidth) / 2));
    const boxY = Math.max(0, Math.floor((virtualSize.height - boxHeight) / 3));
    const pushUi = (key: string, x: number, y: number): void => {
      if (atlas.regions[key] !== undefined) {
        sprites.push({ layer: "ui", key, x, y, sortY: y, sortX: x, scale });
      }
    };
    const pushText = (text: string, x: number, y: number): void => {
      for (const placement of layoutUiText(text)) {
        const glyphX = boxX + (x + placement.x) * scale;
        const glyphY = boxY + y * scale;
        // Shadow first, glyph on top (same position, like the original).
        pushUi(`uifs:${placement.glyphIndex}`, glyphX, glyphY);
        pushUi(`uif:${placement.glyphIndex}`, glyphX, glyphY);
      }
    };

    // Interior pattern between the borders (the side pieces in this
    // atlas are pre-cropped to the condensed box's interior height).
    const interiorWidth = initBoxWidth - popupBorderSize.left - popupBorderSize.right;
    const interiorHeight = initBoxHeight - popupBorderSize.top - popupBorderSize.bottom;
    for (let tileY = 0; tileY < interiorHeight; tileY += 16) {
      for (let tileX = 0; tileX < interiorWidth; tileX += 16) {
        pushUi(
          "uii:310",
          boxX + (popupBorderSize.left + tileX) * scale,
          boxY + (popupBorderSize.top + tileY) * scale,
        );
      }
    }

    for (const piece of popupBorderLayout(initBoxWidth, initBoxHeight)) {
      pushUi(`uifr:${piece.sprite}`, boxX + piece.x * scale, boxY + piece.y * scale);
    }

    const logoRegion = atlas.regions["uilogo"];
    if (logoRegion !== undefined) {
      sprites.push({
        layer: "ui",
        key: "uilogo",
        x: Math.max(0, Math.floor((virtualSize.width - logoRegion.width * scale) / 2)),
        y: Math.max(0, boxY - (logoRegion.height + 8) * scale),
        sortY: 0,
        sortX: 0,
        scale,
      });
    }

    pushText("SERFBOUND", 36, 10);
    pushText("SEED", 8, 24);
    pushText(initScreen.seedString, 8, 36);
    pushText(`SUPPLIES ${initScreen.initialSupplies}`, 8, 56);
    pushText(`MAP SIZE ${initScreen.mapSize}`, 8, 76);
    pushText(`MISSION ${initScreen.mission ?? "CUSTOM"}`, 8, 88);
    pushText("START", 52, 106);
  }

  const sortedSprites = sprites.sort(compareSpritePrimitive);

  return {
    renderer: "webgl2",
    mapSize: decodedFieldColumns,
    virtualSize,
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
      definedArchiveEntries: decodedAssets.definedArchiveEntries,
      mapGroundStatus: `decoded:${decodedAssets.terrainTriangleCount}`,
      pathGroundStatus: "deferred",
      mapObjectsStatus: `decoded:${decodedAssets.objectKeys.length}`,
      mapShadowsStatus: "decoded",
    },
  };
}

function compareSpritePrimitive(
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

function createSceneProjection(size: RenderSize): {
  readonly geometry: MapGeometry;
  readonly transform: MapProjectionTransform;
  readonly heightProvider: MapHeightProvider;
} {
  const geometry = new MapGeometry(sceneProjectionOptions.mapSize);
  return {
    geometry,
    transform: MapProjectionTransform.create({
      geometry,
      virtualSize: size,
      screenSize: size,
      scrollX: sceneProjectionOptions.scrollX,
      scrollY: sceneProjectionOptions.scrollY,
      tileWidth: sceneProjectionOptions.tileWidth,
      tileHeight: sceneProjectionOptions.tileHeight,
    }),
    heightProvider: syntheticSceneHeight(geometry.size),
  };
}

function syntheticSceneHeight(mapSize: number): MapHeightProvider {
  return (tile) => (tile.column * 3 + tile.row * 5 + mapSize) % 8;
}

function diamondTriangles(input: {
  readonly layer: RenderLayerKey;
  readonly top: MapPoint;
  readonly width: number;
  readonly height: number;
  readonly color: RenderColor;
  readonly assetRole: string;
  readonly sortY: number;
  readonly sortX: number;
}): RenderScenePrimitive[] {
  const top = input.top;
  const right = { x: top.x + input.width / 2, y: top.y + input.height / 2 };
  const bottom = { x: top.x, y: top.y + input.height };
  const left = { x: top.x - input.width / 2, y: top.y + input.height / 2 };

  return [
    {
      layer: input.layer,
      points: [top, right, bottom],
      color: input.color,
      assetRole: input.assetRole,
      sortY: input.sortY,
      sortX: input.sortX,
    },
    {
      layer: input.layer,
      points: [top, bottom, left],
      color: input.color,
      assetRole: input.assetRole,
      sortY: input.sortY,
      sortX: input.sortX,
    },
  ];
}

function pathTriangles(top: MapPoint, column: number, row: number): RenderScenePrimitive[] {
  const y = top.y + 8;
  const color = [0.82, 0.73, 0.44, 0.88] as const;
  const left = top.x - 10;
  const right = top.x + 10;
  const center = top.x + ((column + row) % 2 === 0 ? 4 : -4);
  const points = [
    { x: left, y },
    { x: right, y: y + 8 },
    { x: center, y: y + 12 },
  ] as const;

  return [
    {
      layer: "paths",
      points,
      color,
      assetRole: "renderer.pathGround",
      sortY: y + 12,
      sortX: top.x,
    },
  ];
}

function builtFlagTriangles(top: MapPoint, id: number): RenderScenePrimitive[] {
  const poleColor = [0.93, 0.9, 0.73, 1] as const;
  const flagColor = [0.96, 0.27, 0.18, 1] as const;
  const baseY = top.y + 7;
  const poleX = top.x + 1;
  const sortY = top.y + 28;

  return [
    {
      layer: "objects",
      points: [
        { x: poleX - 1, y: baseY - 18 },
        { x: poleX + 1, y: baseY - 18 },
        { x: poleX + 1, y: baseY + 4 },
      ],
      color: poleColor,
      assetRole: "game.builtFlag",
      sortY,
      sortX: top.x + id / 1000,
    },
    {
      layer: "objects",
      points: [
        { x: poleX - 1, y: baseY - 18 },
        { x: poleX + 1, y: baseY + 4 },
        { x: poleX - 1, y: baseY + 4 },
      ],
      color: poleColor,
      assetRole: "game.builtFlag",
      sortY,
      sortX: top.x + id / 1000,
    },
    {
      layer: "markers",
      points: [
        { x: poleX + 1, y: baseY - 18 },
        { x: poleX + 17, y: baseY - 12 },
        { x: poleX + 1, y: baseY - 6 },
      ],
      color: flagColor,
      assetRole: "game.builtFlag",
      sortY: sortY + 1,
      sortX: top.x + id / 1000,
    },
  ];
}

function objectTriangles(top: MapPoint, column: number, row: number): RenderScenePrimitive[] {
  const shadowTop = { x: top.x + 2, y: top.y + 11 };
  const shadow = diamondTriangles({
    layer: "shadows",
    top: shadowTop,
    width: 22,
    height: 8,
    color: [0.02, 0.025, 0.02, 0.34],
    assetRole: "renderer.mapShadows",
    sortY: shadowTop.y + 8,
    sortX: shadowTop.x,
  });
  const markerColor =
    (column + row) % 2 === 0
      ? ([0.82, 0.87, 0.88, 1] as const)
      : ([0.78, 0.3, 0.24, 1] as const);
  const trunk = {
    layer: "objects",
    points: [
      { x: top.x - 5, y: top.y + 2 },
      { x: top.x + 5, y: top.y + 2 },
      { x: top.x, y: top.y + 23 },
    ],
    color: [0.32, 0.23, 0.14, 1] as const,
    assetRole: "renderer.mapObjects",
    sortY: top.y + 23,
    sortX: top.x,
  } satisfies RenderScenePrimitive;
  const marker = {
    layer: "markers",
    points: [
      { x: top.x, y: top.y - 15 },
      { x: top.x + 12, y: top.y + 8 },
      { x: top.x - 12, y: top.y + 8 },
    ],
    color: markerColor,
    assetRole: "renderer.gameObjects",
    sortY: top.y + 24,
    sortX: top.x,
  } satisfies RenderScenePrimitive;

  return [...shadow, trunk, marker];
}

function comparePrimitive(left: RenderScenePrimitive, right: RenderScenePrimitive): number {
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

function summarizeSceneAssets(catalog: TypedAssetCatalog | undefined): RenderSceneAssetSummary {
  if (catalog === undefined) {
    return {
      source: "generated-fixture",
      definedArchiveEntries: null,
      mapGroundStatus: "generated-fixture",
      pathGroundStatus: "generated-fixture",
      mapObjectsStatus: "generated-fixture",
      mapShadowsStatus: "generated-fixture",
    };
  }

  return {
    source: "dos-pa-catalog",
    definedArchiveEntries: catalog.source.definedArchiveEntries,
    mapGroundStatus: resourceSceneStatus(catalog.requests.renderer.mapGround),
    pathGroundStatus: resourceSceneStatus(catalog.requests.renderer.pathGround),
    mapObjectsStatus: resourceSceneStatus(catalog.requests.renderer.mapObjects),
    mapShadowsStatus: resourceSceneStatus(catalog.requests.renderer.mapShadows),
  };
}

function resourceSceneStatus(resource: TypedAssetResource): string {
  return `${resource.availability.status}:${resource.availability.availableCount}/${resource.availability.totalCount}`;
}

function renderDecodedSpriteScene(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  scene: FirstRenderLayerScene,
  atlas: SpriteAtlas,
): void {
  const program = createTextureProgram(gl);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const textureLocation = gl.getUniformLocation(program, "u_texture");
  if (
    positionLocation < 0 ||
    texcoordLocation < 0 ||
    resolutionLocation === null ||
    textureLocation === null
  ) {
    throw new Error("Serfbound WebGL2 decoded scene shader locations are unavailable.");
  }

  const texture = gl.createTexture();
  if (texture === null) {
    throw new Error("Serfbound WebGL2 decoded scene could not allocate the atlas texture.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    atlas.width,
    atlas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array(atlas.rgba.buffer, atlas.rgba.byteOffset, atlas.rgba.byteLength),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const vertices = new Float32Array(scene.sprites.length * 6 * 4);
  let offset = 0;
  for (const sprite of scene.sprites) {
    const region = atlas.regions[sprite.key];
    if (region === undefined) {
      continue;
    }

    const spriteScale = sprite.scale ?? 1;
    const x0 = sprite.x;
    const y0 = sprite.y;
    const x1 = sprite.x + region.width * spriteScale;
    const y1 = sprite.y + region.height * spriteScale;
    const u0 = region.x / atlas.width;
    const v0 = region.y / atlas.height;
    const u1 = (region.x + region.width) / atlas.width;
    const v1 = (region.y + region.height) / atlas.height;
    const quad = [
      x0, y0, u0, v0,
      x1, y0, u1, v0,
      x0, y1, u0, v1,
      x0, y1, u0, v1,
      x1, y0, u1, v0,
      x1, y1, u1, v1,
    ];
    vertices.set(quad, offset);
    offset += quad.length;
  }

  const buffer = gl.createBuffer();
  if (buffer === null) {
    throw new Error("Serfbound WebGL2 decoded scene could not allocate a vertex buffer.");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.07, 0.1, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1i(textureLocation, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices.subarray(0, offset), gl.STATIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(texcoordLocation);
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 16, 8);
  gl.drawArrays(gl.TRIANGLES, 0, offset / 4);
  gl.deleteBuffer(buffer);
  gl.deleteTexture(texture);
}

function createTextureProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    `#version 300 es
    in vec2 a_position;
    in vec2 a_texcoord;
    uniform vec2 u_resolution;
    out vec2 v_texcoord;

    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 clipSpace = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_texcoord = a_texcoord;
    }`,
  );
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    `#version 300 es
    precision mediump float;
    in vec2 v_texcoord;
    uniform sampler2D u_texture;
    out vec4 outColor;

    void main() {
      outColor = texture(u_texture, v_texcoord);
    }`,
  );
  const program = gl.createProgram();
  if (program === null) {
    throw new Error("Serfbound WebGL2 decoded scene could not allocate a shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "unknown program link error";
    gl.deleteProgram(program);
    throw new Error(`Serfbound WebGL2 decoded scene shader failed to link: ${message}`);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    `#version 300 es
    in vec2 a_position;
    in vec4 a_color;
    uniform vec2 u_resolution;
    out vec4 v_color;

    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 clipSpace = zeroToOne * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_color = a_color;
    }`,
  );
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    `#version 300 es
    precision mediump float;
    in vec4 v_color;
    out vec4 outColor;

    void main() {
      outColor = v_color;
    }`,
  );
  const program = gl.createProgram();
  if (program === null) {
    throw new Error("Serfbound WebGL2 scene could not allocate a shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "unknown program link error";
    gl.deleteProgram(program);
    throw new Error(`Serfbound WebGL2 scene shader program failed to link: ${message}`);
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader === null) {
    throw new Error("Serfbound WebGL2 scene could not allocate a shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "unknown shader compile error";
    gl.deleteShader(shader);
    throw new Error(`Serfbound WebGL2 scene shader failed to compile: ${message}`);
  }

  return shader;
}
