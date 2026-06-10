export type EngineBoundary = {
  readonly name: "@serfbound/engine";
  readonly allowsBrowserGlobals: false;
  readonly consumesOracleFixtures: true;
};

export const engineBoundary: EngineBoundary = {
  name: "@serfbound/engine",
  allowsBrowserGlobals: false,
  consumesOracleFixtures: true,
};

export type RandomState = readonly [number, number, number];

export function uint16(value: number): number {
  return value & 0xffff;
}

export function int16(value: number): number {
  const word = uint16(value);
  return word >= 0x8000 ? word - 0x10000 : word;
}

export function uint32(value: number): number {
  return value >>> 0;
}

export function rotateRight16(value: number, bits: number): number {
  const word = uint16(value);
  const shift = bits & 0x0f;
  return uint16((word >>> shift) | (word << ((16 - shift) & 0x0f)));
}

export const directions = [
  "Right",
  "DownRight",
  "Down",
  "Left",
  "UpLeft",
  "Up",
] as const;

export type Direction = (typeof directions)[number];

export type MapPoint = {
  readonly x: number;
  readonly y: number;
};

export type MapTile = {
  readonly column: number;
  readonly row: number;
  readonly position: number;
};

export type MapGeometryDimensions = {
  readonly columnSize: number;
  readonly rowSize: number;
  readonly columns: number;
  readonly rows: number;
  readonly columnMask: number;
  readonly rowMask: number;
  readonly rowShift: number;
  readonly columnRowFactor: number;
  readonly tileCount: number;
};

export type MapGeometryProjectionOptions = {
  readonly scrollX?: number;
  readonly scrollY?: number;
  readonly tileWidth?: number;
  readonly tileHeight?: number;
};

export type MapHeightProvider = (tile: MapTile) => number;

export type MapProjectionRotation = "None" | "Deg90" | "Deg180" | "Deg270";

export type RenderSize = {
  readonly width: number;
  readonly height: number;
};

export type RenderRect = RenderSize & {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

export type MapProjectionTransformOptions = MapGeometryProjectionOptions & {
  readonly geometry: MapGeometry;
  readonly virtualSize: RenderSize;
  readonly screenSize: RenderSize;
  readonly rotation?: MapProjectionRotation;
};

export const directionValues: Record<Direction, number> = {
  Right: 0,
  DownRight: 1,
  Down: 2,
  Left: 3,
  UpLeft: 4,
  Up: 5,
};

const directionByValue = new Map<number, Direction>(
  directions.map((direction) => [directionValues[direction], direction]),
);

const firstSpiralRing = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
] as const;

export function turnDirection(direction: Direction, times: number): Direction {
  const turned = (((directionValues[direction] + times) % 6) + 6) % 6;
  const result = directionByValue.get(turned);

  if (result === undefined) {
    throw new Error(`Unsupported direction value: ${turned}.`);
  }

  return result;
}

export function reverseDirection(direction: Direction): Direction {
  return turnDirection(direction, 3);
}

export function directionCycleClockwise(start: Direction = "Right", length = 6): Direction[] {
  return Array.from({ length }, (_, offset) => turnDirection(start, offset));
}

export function directionCycleCounterClockwise(start: Direction = "Up", length = 6): Direction[] {
  return Array.from({ length }, (_, offset) => turnDirection(start, -offset));
}

export function directionCycleClockwiseWithout(direction: Direction): Direction[] {
  return directionCycleClockwise(turnDirection(direction, 1), 5);
}

export class MapGeometry {
  readonly size: number;
  readonly columnSize: number;
  readonly rowSize: number;
  readonly columns: number;
  readonly rows: number;
  readonly columnMask: number;
  readonly rowMask: number;
  readonly rowShift: number;
  readonly columnRowFactor: number;
  readonly tileCount: number;
  readonly directionOffsets: Record<Direction, number>;

  constructor(size: number) {
    if (!Number.isInteger(size) || size < 1 || size > 23) {
      throw new Error("MapGeometry size must be an integer from 1 through 23.");
    }

    this.size = size;
    this.columnSize = 5 + Math.floor(size / 2);
    this.rowSize = 5 + Math.floor((size - 1) / 2);
    this.columns = 2 ** this.columnSize;
    this.rows = 2 ** this.rowSize;
    this.columnMask = this.columns - 1;
    this.rowMask = this.rows - 1;
    this.rowShift = this.columnSize;
    this.columnRowFactor = size % 2 === 0 ? 4 : 2;
    this.tileCount = this.columns * this.rows;

    this.directionOffsets = {
      Right: 1 & this.columnMask,
      Left: -1 & this.columnMask,
      Down: uint32((1 & this.rowMask) * 2 ** this.rowShift),
      Up: uint32((-1 & this.rowMask) * 2 ** this.rowShift),
      DownRight: 0,
      UpLeft: 0,
    };
    this.directionOffsets.DownRight = uint32(this.directionOffsets.Right + this.directionOffsets.Down);
    this.directionOffsets.UpLeft = uint32(this.directionOffsets.Left + this.directionOffsets.Up);
  }

  get dimensions(): MapGeometryDimensions {
    return {
      columnSize: this.columnSize,
      rowSize: this.rowSize,
      columns: this.columns,
      rows: this.rows,
      columnMask: this.columnMask,
      rowMask: this.rowMask,
      rowShift: this.rowShift,
      columnRowFactor: this.columnRowFactor,
      tileCount: this.tileCount,
    };
  }

  position(column: number, row: number): number {
    return uint32(Math.trunc(row) * 2 ** this.rowShift + Math.trunc(column));
  }

  positionColumn(position: number): number {
    return uint32(position) & this.columnMask;
  }

  positionRow(position: number): number {
    return Math.floor(uint32(position) / 2 ** this.rowShift) & this.rowMask;
  }

  tileAt(column: number, row: number): MapTile {
    const position = this.position(column, row);
    return this.tileFromPosition(position);
  }

  tileFromPosition(position: number): MapTile {
    return {
      column: this.positionColumn(position),
      row: this.positionRow(position),
      position: uint32(position),
    };
  }

  positionAdd(position: number, columnDelta: number, rowDelta: number): number {
    const column =
      (this.columns + this.positionColumn(position) + Math.trunc(columnDelta)) & this.columnMask;
    const row = (this.rows + this.positionRow(position) + Math.trunc(rowDelta)) & this.rowMask;

    return this.position(column, row);
  }

  positionAddOffset(position: number, offset: number): number {
    const column = (this.positionColumn(position) + this.positionColumn(offset)) & this.columnMask;
    const row = (this.positionRow(position) + this.positionRow(offset)) & this.rowMask;

    return this.position(column, row);
  }

  distanceX(left: number, right: number): number {
    return (
      this.columns / 2 -
      (((this.columns / 2 + this.positionColumn(left) - this.positionColumn(right)) &
        this.columnMask))
    );
  }

  distanceY(left: number, right: number): number {
    return (
      this.rows / 2 -
      (((this.rows / 2 + this.positionRow(left) - this.positionRow(right)) & this.rowMask))
    );
  }

  move(position: number, direction: Direction): number {
    return this.positionAddOffset(position, this.directionOffsets[direction]);
  }

  moveRight(position: number): number {
    return this.move(position, "Right");
  }

  moveDownRight(position: number): number {
    return this.move(position, "DownRight");
  }

  moveDown(position: number): number {
    return this.move(position, "Down");
  }

  moveLeft(position: number): number {
    return this.move(position, "Left");
  }

  moveUpLeft(position: number): number {
    return this.move(position, "UpLeft");
  }

  moveUp(position: number): number {
    return this.move(position, "Up");
  }

  moveRightN(position: number, count: number): number {
    return this.positionAdd(position, count, 0);
  }

  moveDownN(position: number, count: number): number {
    return this.positionAdd(position, 0, count);
  }

  directionTo(position: number, otherPosition: number): Direction | undefined {
    return directionCycleClockwise().find((direction) => this.move(position, direction) === otherPosition);
  }

  positionAddSpirally(position: number, offset: number): number {
    const delta = firstSpiralRing[offset];

    if (delta === undefined) {
      throw new Error("Only the first spiral ring is available in the Phase 3 primitive.");
    }

    return this.positionAdd(position, delta[0], delta[1]);
  }

  tileSpaceToMapSpace(
    position: number,
    heightProvider: MapHeightProvider = () => 0,
    options: MapGeometryProjectionOptions = {},
  ): MapPoint {
    const tile = this.tileFromPosition(position);
    const tileWidth = options.tileWidth ?? 32;
    const tileHeight = options.tileHeight ?? 20;
    const x = tile.column * tileWidth - (tile.row * tileWidth) / 2;
    const y = tile.row * tileHeight - 4 * Math.trunc(heightProvider(tile));

    return this.normalizeMapPosition({ x, y }, { tileWidth, tileHeight });
  }

  mapSpaceToViewSpace(
    point: MapPoint,
    options: MapGeometryProjectionOptions = {},
  ): MapPoint {
    const tileWidth = options.tileWidth ?? 32;
    const tileHeight = options.tileHeight ?? 20;
    const mapWidth = this.columns * tileWidth;
    const mapHeight = this.rows * tileHeight;
    let x = point.x - Math.trunc(options.scrollX ?? 0) * tileWidth;
    let y = point.y - Math.trunc(options.scrollY ?? 0) * tileHeight;

    while (y < 0) {
      x -= mapWidth / this.columnRowFactor;
      y += mapHeight;
    }

    while (y >= mapHeight) {
      x += mapWidth / this.columnRowFactor;
      y -= mapHeight;
    }

    while (x < 0) {
      x += mapWidth;
    }

    while (x >= mapWidth) {
      x -= mapWidth;
    }

    return { x, y };
  }

  viewSpaceToMapSpace(
    point: MapPoint,
    options: MapGeometryProjectionOptions = {},
  ): MapPoint {
    const tileWidth = options.tileWidth ?? 32;
    const tileHeight = options.tileHeight ?? 20;
    const mapWidth = this.columns * tileWidth;
    const mapHeight = this.rows * tileHeight;
    let x = point.x + Math.trunc(options.scrollX ?? 0) * tileWidth;
    let y = point.y + Math.trunc(options.scrollY ?? 0) * tileHeight;

    while (y < 0) {
      x += ((this.columnRowFactor - 1) * mapWidth) / this.columnRowFactor;
      y += mapHeight;
    }

    while (y >= mapHeight) {
      x -= ((this.columnRowFactor - 1) * mapWidth) / this.columnRowFactor;
      y -= mapHeight;
    }

    while (x < 0) {
      x += mapWidth;
    }

    while (x >= mapWidth) {
      x -= mapWidth;
    }

    return { x, y };
  }

  mapSpaceToTileSpace(
    point: MapPoint,
    heightProvider: MapHeightProvider = () => 0,
    options: MapGeometryProjectionOptions = {},
  ): number {
    const tileWidth = options.tileWidth ?? 32;
    const tileHeight = options.tileHeight ?? 20;
    const normalized = this.normalizeMapPosition(point, { tileWidth, tileHeight });
    const row = Math.floor(normalized.y / tileHeight) % this.rows;
    const column = Math.floor((normalized.x + (row * tileWidth) / 2) / tileWidth) % this.columns;
    let position = this.position(column, row);
    const mapPosition = this.tileSpaceToMapSpace(position, heightProvider, { tileWidth, tileHeight });
    let candidateY = mapPosition.y;
    let down = (Math.trunc(options.scrollY ?? 0) % 2) === 0;

    if (candidateY > normalized.y) {
      candidateY -= this.rows * tileHeight;
    }

    while (candidateY < normalized.y) {
      const currentHeight = Math.trunc(heightProvider(this.tileFromPosition(position)));
      position = down ? this.moveDown(position) : this.moveDownRight(position);
      const nextHeight = Math.trunc(heightProvider(this.tileFromPosition(position)));
      candidateY += tileHeight - (nextHeight - currentHeight) * 4;
      down = !down;
    }

    const candidates = Array.from({ length: 7 }, (_, offset) =>
      this.positionAddSpirally(position, offset),
    ).sort(
      (left, right) =>
        this.squaredDistanceToMapPosition(left, normalized, heightProvider, { tileWidth, tileHeight }) -
        this.squaredDistanceToMapPosition(right, normalized, heightProvider, { tileWidth, tileHeight }),
    );

    const nearest = candidates[0];
    if (nearest === undefined) {
      throw new Error("MapSpaceToTileSpace could not select a tile candidate.");
    }

    return nearest;
  }

  viewSpaceToTileSpace(
    point: MapPoint,
    heightProvider: MapHeightProvider = () => 0,
    options: MapGeometryProjectionOptions = {},
  ): number {
    return this.mapSpaceToTileSpace(
      this.viewSpaceToMapSpace(point, options),
      heightProvider,
      options,
    );
  }

  normalizeMapPosition(
    point: MapPoint,
    options: Pick<MapGeometryProjectionOptions, "tileWidth" | "tileHeight"> = {},
  ): MapPoint {
    const tileWidth = options.tileWidth ?? 32;
    const tileHeight = options.tileHeight ?? 20;
    const mapWidth = this.columns * tileWidth;
    const mapHeight = this.rows * tileHeight;
    let { x, y } = point;

    while (y < 0) {
      x -= mapWidth / this.columnRowFactor;
      y += mapHeight;
    }

    while (y >= mapHeight) {
      x += mapWidth / this.columnRowFactor;
      y -= mapHeight;
    }

    while (x < 0) {
      x += mapWidth;
    }

    while (x >= mapWidth) {
      x -= mapWidth;
    }

    return { x, y };
  }

  private squaredDistanceToMapPosition(
    position: number,
    point: MapPoint,
    heightProvider: MapHeightProvider,
    options: Required<Pick<MapGeometryProjectionOptions, "tileWidth" | "tileHeight">>,
  ): number {
    const mapWidth = this.columns * options.tileWidth;
    const mapHeight = this.rows * options.tileHeight;
    const mapPosition = this.tileSpaceToMapSpace(position, heightProvider, options);
    let distanceX = Math.abs(point.x - mapPosition.x);
    let distanceY = Math.abs(point.y - mapPosition.y);

    if (distanceY > mapHeight / 2) {
      distanceY = mapHeight - distanceY;
      let wrappedX = mapPosition.x + mapWidth / this.columnRowFactor;
      wrappedX -= mapWidth;
      distanceX = Math.abs(point.x - wrappedX);
    }

    if (distanceX > mapWidth / 2) {
      distanceX = mapWidth - distanceX;
    }

    return distanceX * distanceX + distanceY * distanceY;
  }
}

function assertFinitePositiveSize(size: RenderSize, label: string): void {
  if (
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    throw new Error(`${label} width and height must be finite positive numbers.`);
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function renderRect(left: number, top: number, width: number, height: number): RenderRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function isQuarterTurn(rotation: MapProjectionRotation): boolean {
  return rotation === "Deg90" || rotation === "Deg270";
}

function isClose(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9;
}

function calculateDisplayRect(
  virtualSize: RenderSize,
  screenSize: RenderSize,
  rotation: MapProjectionRotation,
): RenderRect {
  const ratioWidth = isQuarterTurn(rotation) ? virtualSize.height : virtualSize.width;
  const ratioHeight = isQuarterTurn(rotation) ? virtualSize.width : virtualSize.height;
  const virtualRatio = ratioWidth / ratioHeight;
  const screenRatio = screenSize.width / screenSize.height;

  if (isClose(screenRatio, virtualRatio)) {
    return renderRect(0, 0, screenSize.width, screenSize.height);
  }

  if (screenRatio > virtualRatio) {
    const width = screenSize.height * virtualRatio;
    return renderRect((screenSize.width - width) / 2, 0, width, screenSize.height);
  }

  const height = screenSize.width / virtualRatio;
  return renderRect(0, (screenSize.height - height) / 2, screenSize.width, height);
}

function projectionOptions(
  scrollX: number,
  scrollY: number,
  tileWidth: number,
  tileHeight: number,
): Required<MapGeometryProjectionOptions> {
  return { scrollX, scrollY, tileWidth, tileHeight };
}

export class MapProjectionTransform {
  readonly geometry: MapGeometry;
  readonly virtualSize: RenderSize;
  readonly screenSize: RenderSize;
  readonly displayRect: RenderRect;
  readonly rotation: MapProjectionRotation;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly sizeFactorX: number;
  readonly sizeFactorY: number;

  constructor(options: MapProjectionTransformOptions) {
    assertFinitePositiveSize(options.virtualSize, "virtualSize");
    assertFinitePositiveSize(options.screenSize, "screenSize");

    this.geometry = options.geometry;
    this.virtualSize = { ...options.virtualSize };
    this.screenSize = { ...options.screenSize };
    this.rotation = options.rotation ?? "None";
    this.scrollX = options.scrollX ?? 0;
    this.scrollY = options.scrollY ?? 0;
    this.tileWidth = options.tileWidth ?? 32;
    this.tileHeight = options.tileHeight ?? 20;

    assertFiniteNumber(this.scrollX, "scrollX");
    assertFiniteNumber(this.scrollY, "scrollY");
    assertFiniteNumber(this.tileWidth, "tileWidth");
    assertFiniteNumber(this.tileHeight, "tileHeight");

    if (this.tileWidth <= 0 || this.tileHeight <= 0) {
      throw new Error("tileWidth and tileHeight must be finite positive numbers.");
    }

    this.displayRect = calculateDisplayRect(this.virtualSize, this.screenSize, this.rotation);

    if (isQuarterTurn(this.rotation)) {
      this.sizeFactorX = this.virtualSize.height / this.displayRect.width;
      this.sizeFactorY = this.virtualSize.width / this.displayRect.height;
    } else {
      this.sizeFactorX = this.virtualSize.width / this.displayRect.width;
      this.sizeFactorY = this.virtualSize.height / this.displayRect.height;
    }
  }

  static create(options: MapProjectionTransformOptions): MapProjectionTransform {
    return new MapProjectionTransform(options);
  }

  resize(screenSize: RenderSize): MapProjectionTransform {
    return new MapProjectionTransform({
      geometry: this.geometry,
      virtualSize: this.virtualSize,
      screenSize,
      rotation: this.rotation,
      scrollX: this.scrollX,
      scrollY: this.scrollY,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
    });
  }

  get mapOptions(): Required<MapGeometryProjectionOptions> {
    return projectionOptions(this.scrollX, this.scrollY, this.tileWidth, this.tileHeight);
  }

  mapToView(point: MapPoint): MapPoint {
    return this.geometry.mapSpaceToViewSpace(point, this.mapOptions);
  }

  viewToMap(point: MapPoint): MapPoint {
    return this.geometry.viewSpaceToMapSpace(point, this.mapOptions);
  }

  tileToMap(position: number, heightProvider: MapHeightProvider = () => 0): MapPoint {
    return this.geometry.tileSpaceToMapSpace(position, heightProvider, this.mapOptions);
  }

  mapToTile(point: MapPoint, heightProvider: MapHeightProvider = () => 0): number {
    return this.geometry.mapSpaceToTileSpace(point, heightProvider, this.mapOptions);
  }

  tileToView(position: number, heightProvider: MapHeightProvider = () => 0): MapPoint {
    return this.mapToView(this.tileToMap(position, heightProvider));
  }

  viewToTile(point: MapPoint, heightProvider: MapHeightProvider = () => 0): number {
    return this.geometry.viewSpaceToTileSpace(point, heightProvider, this.mapOptions);
  }

  mapToScreen(point: MapPoint): MapPoint {
    return this.viewToScreen(this.mapToView(point));
  }

  screenToMap(point: MapPoint): MapPoint {
    return this.viewToMap(this.screenToView(point));
  }

  tileToScreen(position: number, heightProvider: MapHeightProvider = () => 0): MapPoint {
    return this.viewToScreen(this.tileToView(position, heightProvider));
  }

  screenToTile(point: MapPoint, heightProvider: MapHeightProvider = () => 0): number {
    return this.viewToTile(this.screenToView(point), heightProvider);
  }

  screenToView(point: MapPoint): MapPoint {
    const relativeX =
      clamp(point.x, this.displayRect.left, this.displayRect.right) - this.displayRect.left;
    const relativeY =
      clamp(point.y, this.displayRect.top, this.displayRect.bottom) - this.displayRect.top;
    const rotated = this.rotateScreenRelativeToView(relativeX, relativeY);

    return {
      x: Math.round(this.sizeFactorX * rotated.x),
      y: Math.round(this.sizeFactorY * rotated.y),
    };
  }

  viewToScreen(point: MapPoint): MapPoint {
    const rotated = {
      x: point.x / this.sizeFactorX,
      y: point.y / this.sizeFactorY,
    };
    const relative = this.rotateViewToScreenRelative(rotated.x, rotated.y);

    return {
      x: this.displayRect.left + relative.x,
      y: this.displayRect.top + relative.y,
    };
  }

  private rotateScreenRelativeToView(x: number, y: number): MapPoint {
    switch (this.rotation) {
      case "None":
        return { x, y };
      case "Deg90":
        return { x: y, y: this.displayRect.width - x };
      case "Deg180":
        return { x: this.displayRect.width - x, y: this.displayRect.height - y };
      case "Deg270":
        return { x: this.displayRect.height - y, y: x };
    }
  }

  private rotateViewToScreenRelative(x: number, y: number): MapPoint {
    switch (this.rotation) {
      case "None":
        return { x, y };
      case "Deg90":
        return { x: this.displayRect.width - y, y: x };
      case "Deg180":
        return { x: this.displayRect.width - x, y: this.displayRect.height - y };
      case "Deg270":
        return { x: y, y: this.displayRect.height - x };
    }
  }
}

export class FreeserfRandom {
  static fromWord(value: number): FreeserfRandom {
    return new FreeserfRandom([value, value, value]);
  }

  static fromState(base0: number, base1: number, base2: number): FreeserfRandom {
    return new FreeserfRandom([base0, base1, base2]);
  }

  static fromStringSeed(value: string): FreeserfRandom {
    if (!/^[1-8]{16}$/.test(value)) {
      throw new Error("Freeserf random string seeds must contain 16 digits from 1 to 8.");
    }

    let packed = 0n;
    for (let index = 15; index >= 0; index -= 1) {
      const charCode = value.charCodeAt(index);
      packed <<= 3n;
      packed |= BigInt(charCode - "0".charCodeAt(0) - 1);
    }

    return new FreeserfRandom([
      Number(packed & 0xffffn),
      Number((packed >> 16n) & 0xffffn),
      Number((packed >> 32n) & 0xffffn),
    ]);
  }

  static xor(left: FreeserfRandom, right: FreeserfRandom): FreeserfRandom {
    const leftState = left.state;
    const rightState = right.state;
    return new FreeserfRandom([
      leftState[0] ^ rightState[0],
      leftState[1] ^ rightState[1],
      leftState[2] ^ rightState[2],
    ]);
  }

  readonly #state: [number, number, number];

  private constructor(state: RandomState) {
    this.#state = [uint16(state[0]), uint16(state[1]), uint16(state[2])];
  }

  get state(): RandomState {
    return [...this.#state] as RandomState;
  }

  clone(): FreeserfRandom {
    return new FreeserfRandom(this.#state);
  }

  next(): number {
    const state = this.#state;
    const result = uint16((state[0] + state[1]) ^ state[2]);
    state[2] = uint16(state[2] + state[1]);
    state[1] = uint16(state[1] ^ state[2]);
    state[1] = rotateRight16(state[1], 1);
    state[2] = rotateRight16(state[2], 1);
    state[0] = result;

    return result;
  }

  toString(): string {
    let packed =
      BigInt(this.#state[0]) |
      (BigInt(this.#state[1]) << 16n) |
      (BigInt(this.#state[2]) << 32n);
    let value = "";

    for (let index = 0; index < 16; index += 1) {
      value += String.fromCharCode(Number(packed & 0x07n) + "1".charCodeAt(0));
      packed >>= 3n;
    }

    return value;
  }
}

export * from "./commands.js";
export * from "./local-game.js";
export * from "./simulation.js";
export * from "./map-generator.js";
export * from "./game-world.js";
export * from "./pathfinder.js";
export * from "./world-commands.js";
export * from "./serfs.js";
export * from "./missions.js";
export * from "./ai.js";
export * from "./dos-savegame.js";
export * from "./inventory.js";
export * from "./checksum.js";
export * from "./lockstep.js";
export * from "./session-protocol.js";
export * from "./correspondence.js";
