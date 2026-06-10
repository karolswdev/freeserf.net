import type { TypedAssetCatalog, TypedAssetResource } from "@serfbound/assets";
import {
  MapGeometry,
  MapProjectionTransform,
  type SerfboundBuiltStructure,
  type MapHeightProvider,
  type MapPoint,
  type MapTile,
  type RenderSize,
} from "@serfbound/engine";

export const renderLayerOrder = ["terrain", "paths", "shadows", "objects", "markers"] as const;

export type RenderLayerKey = (typeof renderLayerOrder)[number];

export type RenderSceneSource = "generated-fixture" | "dos-pa-catalog";

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
  readonly builtStructures?: readonly SerfboundBuiltStructure[];
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
  gl.clearColor(0.07, 0.1, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
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
