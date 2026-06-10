import { MapGeometry, type Direction } from "./index.js";
import { createInventory, type WorldInventory } from "./inventory.js";
import {
  classicSpiralPattern,
  mapObject,
  mapSpace,
  mapSpaceFromObject,
  mapTerrain,
  type ClassicMapLandscape,
} from "./map-generator.js";

// Game world ported from the structural subsets of Freeserf.Core Map.cs
// (game tiles: paths/owner/object index), Game.cs (build validity, building,
// land ownership) and Flag.cs (road graph connections). Serf-related parts of
// the reference (transporter wakeups, serf reassignment on split/merge) are
// explicitly deferred to Phase 13 and marked below.

export const buildingType = {
  none: 0,
  fisher: 1,
  lumberjack: 2,
  boatbuilder: 3,
  stonecutter: 4,
  stoneMine: 5,
  coalMine: 6,
  ironMine: 7,
  goldMine: 8,
  forester: 9,
  stock: 10,
  hut: 11,
  farm: 12,
  butcher: 13,
  pigFarm: 14,
  mill: 15,
  baker: 16,
  sawmill: 17,
  steelSmelter: 18,
  toolMaker: 19,
  weaponSmith: 20,
  tower: 21,
  fortress: 22,
  goldSmelter: 23,
  castle: 24,
} as const;

export type BuildingTypeValue = (typeof buildingType)[keyof typeof buildingType];

const smallBuildingTypes: readonly number[] = [
  buildingType.fisher,
  buildingType.lumberjack,
  buildingType.boatbuilder,
  buildingType.stonecutter,
  buildingType.forester,
  buildingType.hut,
  buildingType.mill,
];

const mineBuildingTypes: readonly number[] = [
  buildingType.stoneMine,
  buildingType.coalMine,
  buildingType.ironMine,
  buildingType.goldMine,
];

const militaryBuildingTypes: readonly number[] = [
  buildingType.hut,
  buildingType.tower,
  buildingType.fortress,
];

// Building.UpdateMilitary occupant tables: needed knights by occupation
// level (rows: max levels 0..4, then the reduced-knight levels 5..9).
const hutOccupantsFromLevel: readonly number[] = [1, 1, 2, 2, 3, 1, 1, 1, 1, 2];
const towerOccupantsFromLevel: readonly number[] = [1, 2, 3, 4, 6, 1, 1, 2, 3, 4];
const fortressOccupantsFromLevel: readonly number[] = [1, 3, 6, 9, 12, 1, 2, 4, 6, 8];

// Building.UpdateMilitary gold caps per military type.
export function militaryGoldCap(type: BuildingTypeValue): number {
  if (type === buildingType.hut) return 2;
  if (type === buildingType.tower) return 4;
  if (type === buildingType.fortress) return 8;
  return 0;
}

// Needed occupants for a military building given the owner's occupation
// settings and the building's threat level.
export function militaryKnightsNeeded(
  building: { type: BuildingTypeValue; threatLevel: number },
  knightOccupation: readonly number[],
): number {
  const maxOccupiedLevel = Math.min(
    (knightOccupation[building.threatLevel]! >> 4) & 0xf,
    9,
  );
  if (building.type === buildingType.hut) return hutOccupantsFromLevel[maxOccupiedLevel]!;
  if (building.type === buildingType.tower) return towerOccupantsFromLevel[maxOccupiedLevel]!;
  if (building.type === buildingType.fortress) {
    return fortressOccupantsFromLevel[maxOccupiedLevel]!;
  }

  return 0;
}

export function isMilitaryBuildingType(type: BuildingTypeValue): boolean {
  return militaryBuildingTypes.includes(type);
}

export type FlagPathState = {
  hasPath: boolean;
  water: boolean;
  lengthCategory: number;
  freeTransporters: number;
  serfRequested: boolean;
  otherFlagIndex: number;
  otherEndDirection: Direction | null;
};

export type FlagResourceSlot = {
  // Resource type value or -1 for empty (reference Resource.Type.None).
  resource: number;
  destinationFlagIndex: number;
  scheduledDirection: Direction | null;
};

export type WorldFlag = {
  readonly index: number;
  position: number;
  player: number;
  readonly paths: Record<Direction, FlagPathState>;
  buildingIndex: number | null;
  hasInventory: boolean;
  // Global.FLAG_MAX_RES_COUNT = 8 resource slots per flag.
  readonly slots: FlagResourceSlot[];
};

export type WorldBuilding = {
  readonly index: number;
  position: number;
  player: number;
  type: BuildingTypeValue;
  flagIndex: number;
  levelHeight: number;
  isDone: boolean;
  // Interim construction model until Phase 13 serf labor: 0 = site leveling,
  // 1 = frame stage. Completion derives from ticks since startTick.
  progress: number;
  startTick: number;
  // Resources delivered by transporters, tallied by resource type value.
  deliveredResources: Record<number, number>;
  // Resources dispatched but still in flight (the reference building stock
  // "requested" count; producers stop sending once delivered + requested
  // reaches the stock cap).
  requestedResources: Record<number, number>;
  // Serf-driven construction state.
  builderTicks: number;
  consumedMaterials: number;
  // Military occupation: knights garrisoned and in flight, and the
  // building's threat level (Building.ThreatLevel, 0 = interior).
  knights: number;
  requestedKnights: number;
  threatLevel: number;
};

// Building.ConstructionInfos material costs: [planks, stones] per type.
export const buildingConstructionCosts: readonly (readonly [number, number])[] = [
  [0, 0], [2, 0], [2, 0], [3, 0], [2, 0],
  [4, 1], [5, 0], [5, 0], [5, 0],
  [2, 0], [4, 3], [1, 1], [4, 1], [2, 1], [4, 1], [3, 1],
  [2, 1], [3, 2], [3, 2], [3, 3], [2, 1], [2, 3], [5, 5], [4, 1],
  [0, 0],
];

// Serf-driven construction pacing (SB-13-04): the builder levels the site
// for 40 work ticks, then consumes one delivered material per 30 work ticks;
// the building completes when every material is consumed.
export const constructionLevelingTicks = 40;
export const constructionTicksPerMaterial = 30;

export type WorldPlayer = {
  readonly index: number;
  hasCastle: boolean;
  castlePosition: number | null;
  landArea: number;
  // Player.UpdateKnightMorale state: morale from gold reserves vs the
  // map's total gold, and the gold counted toward it.
  knightMorale: number;
  goldDeposited: number;
  // Player settings.CastleKnightsWanted (reference default).
  castleKnightsWanted: number;
  // Player settings.KnightOccupation per threat level (reference defaults);
  // high nibble = max occupied level into the occupants tables.
  knightOccupation: number[];
  // Game.PlayerDefeated: the castle fell.
  defeated: boolean;
};

export type RoadPlan = {
  readonly start: number;
  readonly directions: readonly Direction[];
};

const directionOrder: readonly Direction[] = ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"];
const reverseOf: Record<Direction, Direction> = {
  Right: "Left",
  DownRight: "UpLeft",
  Down: "Up",
  Left: "Right",
  UpLeft: "DownRight",
  Up: "Down",
};

// Flag.GetRoadLengthValue
export function roadLengthCategory(roadLength: number): number {
  if (roadLength >= 24) return 7;
  if (roadLength >= 18) return 6;
  if (roadLength >= 13) return 5;
  if (roadLength >= 10) return 4;
  if (roadLength >= 7) return 3;
  if (roadLength >= 6) return 2;
  if (roadLength >= 4) return 1;
  return 0;
}

// Game.cs military influence tables.
const militaryInfluence = [
  0, 1, 2, 4, 7, 12, 18, 29, -1, -1,
  0, 3, 5, 8, 11, 15, 22, 30, -1, -1,
  0, 6, 10, 14, 19, 23, 27, 31, -1, -1,
] as const;

const mapCloseness = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0,
  1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0,
  1, 2, 3, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0, 0, 0, 0, 0,
  1, 2, 3, 4, 5, 5, 5, 5, 5, 4, 3, 2, 1, 0, 0, 0, 0,
  1, 2, 3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 2, 1, 0, 0, 0,
  1, 2, 3, 4, 5, 6, 7, 7, 7, 6, 5, 4, 3, 2, 1, 0, 0,
  1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 6, 5, 4, 3, 2, 1,
  0, 0, 0, 1, 2, 3, 4, 5, 6, 6, 6, 6, 5, 4, 3, 2, 1,
  0, 0, 0, 0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 4, 3, 2, 1,
  0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 3, 2, 1,
  0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1,
  0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
] as const;

function emptyFlagPaths(): Record<Direction, FlagPathState> {
  const paths = {} as Record<Direction, FlagPathState>;
  for (const direction of directionOrder) {
    paths[direction] = {
      hasPath: false,
      water: false,
      lengthCategory: 0,
      freeTransporters: 0,
      serfRequested: false,
      otherFlagIndex: 0,
      otherEndDirection: null,
    };
  }

  return paths;
}

export class SerfboundGameWorld {
  readonly geometry: MapGeometry;
  readonly heights: Uint8Array;
  readonly typesUp: Uint8Array;
  readonly typesDown: Uint8Array;
  readonly objects: Uint8Array;
  readonly minerals: Uint8Array;
  readonly resourceAmounts: Uint8Array;
  readonly paths: Uint8Array;
  readonly owners: Int8Array;
  // GameInitBox player supplies setting consumed by buildCastle.
  initialSupplies = 20;
  // Mission per-player supplies (falls back to initialSupplies).
  playerSupplies: number[] | undefined;
  readonly objectIndexes: Uint32Array;
  readonly flags = new Map<number, WorldFlag>();
  readonly buildings = new Map<number, WorldBuilding>();
  readonly inventories = new Map<number, WorldInventory>();
  readonly players: WorldPlayer[];
  #nextFlagIndex = 1;
  #nextBuildingIndex = 1;
  readonly #spiralPositions: readonly number[];

  constructor(landscape: ClassicMapLandscape, playerCount = 1) {
    this.geometry = new MapGeometry(landscape.size);
    this.heights = Uint8Array.from(landscape.heights);
    this.typesUp = Uint8Array.from(landscape.typesUp);
    this.typesDown = Uint8Array.from(landscape.typesDown);
    this.objects = Uint8Array.from(landscape.objects);
    this.minerals = Uint8Array.from(landscape.minerals);
    this.resourceAmounts = Uint8Array.from(landscape.resourceAmounts);
    this.paths = new Uint8Array(landscape.tileCount);
    this.owners = new Int8Array(landscape.tileCount).fill(-1);
    this.objectIndexes = new Uint32Array(landscape.tileCount);
    this.players = Array.from({ length: playerCount }, (_, index) => ({
      index,
      hasCastle: false,
      castlePosition: null,
      landArea: 0,
      knightMorale: 1024,
      goldDeposited: 0,
      castleKnightsWanted: 3,
      knightOccupation: [0x10, 0x21, 0x32, 0x43],
      defeated: false,
    }));
    this.#spiralPositions = classicSpiralPattern.map(([x, y]) =>
      this.geometry.position(x & this.geometry.columnMask, y & this.geometry.rowMask),
    );
  }

  // Structural compatibility with ClassicMapLandscape so renderers can read
  // the live world the same way they read a freshly generated landscape.
  get size(): number {
    return this.geometry.size;
  }

  get columns(): number {
    return this.geometry.columns;
  }

  get rows(): number {
    return this.geometry.rows;
  }

  get tileCount(): number {
    return this.geometry.tileCount;
  }

  // --- tile access -----------------------------------------------------------

  positionAddSpirally(position: number, offset: number): number {
    return this.geometry.positionAddOffset(position, this.#spiralPositions[offset]!);
  }

  move(position: number, direction: Direction): number {
    return this.geometry.move(position, direction);
  }

  hasOwner(position: number): boolean {
    return this.owners[position]! >= 0;
  }

  owner(position: number): number {
    return this.owners[position]!;
  }

  hasPath(position: number, direction: Direction): boolean {
    return (this.paths[position]! & (1 << directionOrder.indexOf(direction))) !== 0;
  }

  pathsAt(position: number): number {
    return this.paths[position]! & 0x3f;
  }

  addPath(position: number, direction: Direction): void {
    this.paths[position] = this.paths[position]! | (1 << directionOrder.indexOf(direction));
  }

  deletePath(position: number, direction: Direction): void {
    this.paths[position] = this.paths[position]! & ~(1 << directionOrder.indexOf(direction));
  }

  objectAt(position: number): number {
    return this.objects[position]!;
  }

  setObject(position: number, objectValue: number, index: number | null): void {
    this.objects[position] = objectValue;
    if (index !== null) {
      this.objectIndexes[position] = index;
    }
  }

  hasFlag(position: number): boolean {
    return this.objects[position] === mapObject.flag;
  }

  hasBuilding(position: number): boolean {
    return (
      this.objects[position]! >= mapObject.smallBuilding &&
      this.objects[position]! <= mapObject.castle
    );
  }

  flagAt(position: number): WorldFlag | null {
    return this.hasFlag(position) ? (this.flags.get(this.objectIndexes[position]!) ?? null) : null;
  }

  buildingAt(position: number): WorldBuilding | null {
    return this.hasBuilding(position)
      ? (this.buildings.get(this.objectIndexes[position]!) ?? null)
      : null;
  }

  isWaterTile(position: number): boolean {
    return (
      this.typesDown[position]! <= mapTerrain.water3 &&
      this.typesUp[position]! <= mapTerrain.water3
    );
  }

  isInWater(position: number): boolean {
    return (
      this.isWaterTile(position) &&
      this.isWaterTile(this.move(position, "UpLeft")) &&
      this.typesDown[this.move(position, "Left")]! <= mapTerrain.water3 &&
      this.typesUp[this.move(position, "Up")]! <= mapTerrain.water3
    );
  }

  // --- road segment rules (Map.cs) -------------------------------------------

  isRoadSegmentValid(position: number, direction: Direction, endThere = false): boolean {
    const otherPosition = this.move(position, direction);
    const objectValue = this.objects[otherPosition]!;

    if (
      (this.pathsAt(otherPosition) !== 0 && objectValue !== mapObject.flag) ||
      mapSpaceFromObject[objectValue]! >= mapSpace.semipassable
    ) {
      return false;
    }

    if (!this.hasOwner(otherPosition) || this.owner(otherPosition) !== this.owner(position)) {
      return false;
    }

    if (
      this.isInWater(position) !== this.isInWater(otherPosition) &&
      !(endThere || this.hasFlag(position) || this.hasFlag(otherPosition))
    ) {
      return false;
    }

    return true;
  }

  roadSegmentInWater(position: number, direction: Direction): boolean {
    if (directionOrder.indexOf(direction) > directionOrder.indexOf("Down")) {
      position = this.move(position, direction);
      direction = reverseOf[direction];
    }

    switch (direction) {
      case "Right":
        return (
          this.typesDown[position]! <= mapTerrain.water3 &&
          this.typesUp[this.move(position, "Up")]! <= mapTerrain.water3
        );
      case "DownRight":
        return (
          this.typesUp[position]! <= mapTerrain.water3 &&
          this.typesDown[position]! <= mapTerrain.water3
        );
      case "Down":
        return (
          this.typesUp[position]! <= mapTerrain.water3 &&
          this.typesDown[this.move(position, "Left")]! <= mapTerrain.water3
        );
      default:
        return false;
    }
  }

  // --- flag building (Game.cs) ------------------------------------------------

  canBuildFlag(position: number, player: number): boolean {
    if (!this.hasOwner(position) || this.owner(position) !== player) {
      return false;
    }

    if (mapSpaceFromObject[this.objects[position]!]! !== mapSpace.open) {
      return false;
    }

    if (this.positionInWaterHexagon(position)) {
      return false;
    }

    for (const direction of directionOrder) {
      if (this.objects[this.move(position, direction)] === mapObject.flag) {
        return false;
      }
    }

    return true;
  }

  positionInWaterHexagon(position: number): boolean {
    return (
      this.typesUp[position]! <= mapTerrain.water3 &&
      this.typesDown[position]! <= mapTerrain.water3 &&
      this.typesDown[this.move(position, "Left")]! <= mapTerrain.water3 &&
      this.typesUp[this.move(position, "UpLeft")]! <= mapTerrain.water3 &&
      this.typesDown[this.move(position, "UpLeft")]! <= mapTerrain.water3 &&
      this.typesUp[this.move(position, "Up")]! <= mapTerrain.water3
    );
  }

  buildFlag(position: number, player: number): WorldFlag | null {
    if (!this.canBuildFlag(position, player)) {
      return null;
    }

    const flag = this.#allocateFlag(position, player);
    this.setObject(position, mapObject.flag, flag.index);

    if (this.pathsAt(position) !== 0) {
      this.#splitPathAtFlag(position);
    }

    return flag;
  }

  #allocateFlag(position: number, player: number): WorldFlag {
    const flag: WorldFlag = {
      index: this.#nextFlagIndex,
      position,
      player,
      paths: emptyFlagPaths(),
      buildingIndex: null,
      hasInventory: false,
      slots: Array.from({ length: 8 }, () => ({
        resource: -1,
        destinationFlagIndex: 0,
        scheduledDirection: null,
      })),
    };
    this.#nextFlagIndex += 1;
    this.flags.set(flag.index, flag);
    return flag;
  }

  // --- roads (Game.cs BuildRoad + Flag.LinkWithFlag) ---------------------------

  canBuildRoad(road: RoadPlan, player: number, endThere = false): { valid: boolean; destination: number; water: boolean } {
    const invalid = { valid: false, destination: 0, water: false };
    let position = road.start;

    if (!this.hasOwner(position) || this.owner(position) !== player || !this.hasFlag(position)) {
      return invalid;
    }

    let test = 0;
    let counter = 0;
    for (const direction of road.directions) {
      counter += 1;
      if (!this.isRoadSegmentValid(position, direction, endThere)) {
        return invalid;
      }

      test |= this.roadSegmentInWater(position, direction) ? 2 : 1;
      position = this.move(position, direction);

      if (
        !this.hasOwner(position) ||
        this.owner(position) !== player ||
        (this.hasFlag(position) && counter !== road.directions.length)
      ) {
        return invalid;
      }
    }

    if (test === 3) {
      // Mixed ground and water path.
      return invalid;
    }

    return { valid: true, destination: position, water: (test & 2) !== 0 };
  }

  buildRoad(road: RoadPlan, player: number): boolean {
    if (road.directions.length === 0) {
      return false;
    }

    const check = this.canBuildRoad(road, player);
    if (!check.valid || !this.hasFlag(check.destination)) {
      return false;
    }

    // Map.PlaceRoadSegments
    let position = road.start;
    for (const direction of road.directions) {
      this.addPath(position, direction);
      position = this.move(position, direction);
      this.addPath(position, reverseOf[direction]);
    }

    const sourceFlag = this.flagAt(road.start)!;
    const destinationFlag = this.flagAt(check.destination)!;
    this.#linkFlags(sourceFlag, destinationFlag, check.water, road);

    return true;
  }

  // Flag.LinkWithFlag: the source flag's path leaves through the road's first
  // direction; the destination flag's through the reverse of the last one.
  #linkFlags(
    sourceFlag: WorldFlag,
    destinationFlag: WorldFlag,
    water: boolean,
    road: RoadPlan,
  ): void {
    const sourceDirection = road.directions[0]!;
    const destinationDirection = reverseOf[road.directions[road.directions.length - 1]!];
    const lengthCategory = roadLengthCategory(road.directions.length);

    const sourcePath = sourceFlag.paths[sourceDirection];
    sourcePath.hasPath = true;
    sourcePath.water = water;
    sourcePath.lengthCategory = lengthCategory;
    sourcePath.freeTransporters = 0;
    sourcePath.serfRequested = false;
    sourcePath.otherFlagIndex = destinationFlag.index;
    sourcePath.otherEndDirection = destinationDirection;

    const destinationPath = destinationFlag.paths[destinationDirection];
    destinationPath.hasPath = true;
    destinationPath.water = water;
    destinationPath.lengthCategory = lengthCategory;
    destinationPath.freeTransporters = 0;
    destinationPath.serfRequested = false;
    destinationPath.otherFlagIndex = sourceFlag.index;
    destinationPath.otherEndDirection = sourceDirection;
  }

  // Game.BuildFlagSplitPath, structural subset (serf reassignment deferred to
  // Phase 13 — no serfs exist yet).
  #splitPathAtFlag(position: number): void {
    let path1Direction: Direction | null = null;
    let path2Direction: Direction | null = null;
    for (const direction of directionOrder) {
      if (this.hasPath(position, direction)) {
        if (path1Direction === null) {
          path1Direction = direction;
        } else {
          path2Direction = direction;
          break;
        }
      }
    }

    if (path2Direction === "UpLeft" && this.hasPath(position, "Up")) {
      path2Direction = "Up";
    }

    if (path1Direction === null || path2Direction === null) {
      return;
    }

    const path1 = this.#tracePathToFlag(position, path1Direction);
    const path2 = this.#tracePathToFlag(position, path2Direction);
    const flag = this.flagAt(position)!;

    this.#restorePathInfo(flag, path1Direction, path1);
    this.#restorePathInfo(flag, path2Direction, path2);
  }

  // Flag.FillPathSerfInfo, structural subset: walk the path to the next flag.
  #tracePathToFlag(
    position: number,
    direction: Direction,
  ): { flagIndex: number; flagDirection: Direction; pathLength: number } {
    let pathLength = 0;
    let current = position;
    let currentDirection = direction;

    for (;;) {
      pathLength += 1;
      current = this.move(current, currentDirection);
      let paths = this.pathsAt(current);
      paths &= ~(1 << directionOrder.indexOf(reverseOf[currentDirection]));

      if (this.hasFlag(current)) {
        break;
      }

      for (const checkDirection of directionOrder) {
        if ((paths & (1 << directionOrder.indexOf(checkDirection))) !== 0) {
          currentDirection = checkDirection;
          break;
        }
      }
    }

    return {
      flagIndex: this.objectIndexes[current]!,
      flagDirection: reverseOf[currentDirection],
      pathLength,
    };
  }

  // Flag.RestorePathSerfInfo, structural subset.
  #restorePathInfo(
    flag: WorldFlag,
    direction: Direction,
    data: { flagIndex: number; flagDirection: Direction; pathLength: number },
  ): void {
    const otherFlag = this.flags.get(data.flagIndex)!;
    const otherPath = otherFlag.paths[data.flagDirection];
    const lengthCategory = roadLengthCategory(data.pathLength);

    const path = flag.paths[direction];
    path.hasPath = true;
    path.water = otherPath.water;
    path.lengthCategory = lengthCategory;
    path.otherFlagIndex = otherFlag.index;
    path.otherEndDirection = data.flagDirection;

    otherPath.lengthCategory = lengthCategory;
    otherPath.otherFlagIndex = flag.index;
    otherPath.otherEndDirection = direction;
  }

  // --- flag demolition (Game.DemolishFlag + Flag.MergePaths, structural) -------

  canDemolishFlag(position: number, player: number): boolean {
    const flag = this.flagAt(position);
    if (flag === null || flag.buildingIndex !== null) {
      return false;
    }

    if (this.pathsAt(position) === 0) {
      return true;
    }

    if (flag.player !== player) {
      return false;
    }

    // Flag.CanDemolish: exactly two non-water paths to distinct endpoints.
    let connected = 0;
    let otherEnd: number | null = null;
    for (const direction of directionOrder) {
      const path = flag.paths[direction];
      if (path.hasPath) {
        if (path.water) {
          return false;
        }

        connected += 1;
        if (otherEnd !== null && path.otherFlagIndex === otherEnd) {
          return false;
        }

        otherEnd ??= path.otherFlagIndex;
      }
    }

    return connected === 2;
  }

  demolishFlag(position: number, player: number): boolean {
    if (!this.canDemolishFlag(position, player)) {
      return false;
    }

    const flag = this.flagAt(position)!;

    if (this.pathsAt(position) !== 0) {
      // Flag.MergePaths, structural subset.
      let path1Direction: Direction | null = null;
      let path2Direction: Direction | null = null;
      for (const direction of directionOrder) {
        if (this.hasPath(position, direction)) {
          path1Direction ??= direction;
        }
      }
      for (const direction of [...directionOrder].reverse()) {
        if (this.hasPath(position, direction)) {
          path2Direction ??= direction;
        }
      }

      if (path1Direction !== null && path2Direction !== null && path1Direction !== path2Direction) {
        const path1 = this.#tracePathToFlag(position, path1Direction);
        const path2 = this.#tracePathToFlag(position, path2Direction);
        const flag1 = this.flags.get(path1.flagIndex)!;
        const flag2 = this.flags.get(path2.flagIndex)!;
        const mergedCategory = roadLengthCategory(path1.pathLength + path2.pathLength);

        const flag1Path = flag1.paths[path1.flagDirection];
        flag1Path.otherFlagIndex = flag2.index;
        flag1Path.otherEndDirection = path2.flagDirection;
        flag1Path.lengthCategory = mergedCategory;

        const flag2Path = flag2.paths[path2.flagDirection];
        flag2Path.otherFlagIndex = flag1.index;
        flag2Path.otherEndDirection = path1.flagDirection;
        flag2Path.lengthCategory = mergedCategory;
      }
    }

    this.setObject(position, mapObject.none, 0);
    this.objectIndexes[position] = 0;
    this.flags.delete(flag.index);
    return true;
  }

  // --- building validity (Game.cs) ----------------------------------------------

  canPlayerBuild(position: number, player: number): boolean {
    if (!this.players[player]!.hasCastle) {
      return false;
    }

    for (let i = 0; i < 7; i += 1) {
      const adjacent = this.positionAddSpirally(position, i);
      if (!this.hasOwner(adjacent) || this.owner(adjacent) !== player) {
        return false;
      }
    }

    if (this.positionInWaterHexagon(position)) {
      return false;
    }

    if (this.pathsAt(position) !== 0) {
      return false;
    }

    return true;
  }

  mapTypesWithin(position: number, low: number, high: number): boolean {
    const types = [
      this.typesUp[position]!,
      this.typesDown[position]!,
      this.typesDown[this.move(position, "Left")]!,
      this.typesUp[this.move(position, "UpLeft")]!,
      this.typesDown[this.move(position, "UpLeft")]!,
      this.typesUp[this.move(position, "Up")]!,
    ];
    return types.every((terrain) => terrain >= low && terrain <= high);
  }

  canBuildSmall(position: number): boolean {
    return this.mapTypesWithin(position, mapTerrain.grass0, mapTerrain.grass3);
  }

  canBuildMine(position: number): boolean {
    let canBuild = false;
    const types = [
      this.typesDown[position]!,
      this.typesUp[position]!,
      this.typesDown[this.move(position, "Left")]!,
      this.typesUp[this.move(position, "UpLeft")]!,
      this.typesDown[this.move(position, "UpLeft")]!,
      this.typesUp[this.move(position, "Up")]!,
    ];

    for (const terrain of types) {
      if (terrain >= mapTerrain.tundra0 && terrain <= mapTerrain.snow0) {
        canBuild = true;
      } else if (!(terrain >= mapTerrain.grass0 && terrain <= mapTerrain.grass3)) {
        return false;
      }
    }

    return canBuild;
  }

  canBuildMilitary(position: number): boolean {
    for (let i = 0; i < 1 + 6 + 12; i += 1) {
      const adjacent = this.positionAddSpirally(position, i);
      const building = this.buildingAt(adjacent);
      if (building !== null && militaryBuildingTypes.includes(building.type)) {
        return false;
      }
    }

    return true;
  }

  canBuildLarge(position: number): boolean {
    for (let i = 0; i < 6; i += 1) {
      const adjacent = this.positionAddSpirally(position, 1 + i);
      if (mapSpaceFromObject[this.objects[adjacent]!]! >= mapSpace.semipassable) {
        return false;
      }
    }

    for (let i = 0; i < 12; i += 1) {
      const adjacent = this.positionAddSpirally(position, 7 + i);
      if (
        this.objects[adjacent]! >= mapObject.largeBuilding &&
        this.objects[adjacent]! <= mapObject.castle
      ) {
        return false;
      }
    }

    if (
      this.typesUp[position] !== mapTerrain.grass1 ||
      this.typesDown[position] !== mapTerrain.grass1 ||
      this.typesDown[this.move(position, "Left")] !== mapTerrain.grass1 ||
      this.typesUp[this.move(position, "UpLeft")] !== mapTerrain.grass1 ||
      this.typesDown[this.move(position, "UpLeft")] !== mapTerrain.grass1 ||
      this.typesUp[this.move(position, "Up")] !== mapTerrain.grass1
    ) {
      return false;
    }

    return this.levelingHeight(position) >= 0;
  }

  levelingHeight(position: number): number {
    let heightMin = 31;
    let heightMax = 0;

    for (let i = 0; i < 12; i += 1) {
      const adjacent = this.positionAddSpirally(position, 7 + i);
      const height = this.heights[adjacent]!;
      heightMin = Math.min(heightMin, height);
      heightMax = Math.max(heightMax, height);
    }

    for (let i = 0; i < 18; i += 1) {
      const adjacent = this.positionAddSpirally(position, 19 + i);
      if (this.objects[adjacent] === mapObject.largeBuilding) {
        const building = this.buildings.get(this.objectIndexes[adjacent]!);
        if (building !== undefined && !building.isDone && building.progress === 0) {
          heightMin = Math.min(heightMin, building.levelHeight);
          heightMax = Math.max(heightMax, building.levelHeight);
        }
      }
    }

    if (heightMax - heightMin >= 9) {
      return -1;
    }

    let heightMean = this.heights[position]!;
    for (let i = 0; i < 7; i += 1) {
      heightMean += this.heights[this.positionAddSpirally(position, i)]!;
    }
    heightMean >>= 3;

    const heightNewMin = Math.max(heightMax > 4 ? heightMax - 4 : 1, 1);
    const heightNewMax = heightMin + 4;
    return Math.max(heightNewMin, Math.min(heightMean, heightNewMax));
  }

  canBuildBuilding(position: number, type: BuildingTypeValue, player: number): boolean {
    if (!this.canPlayerBuild(position, player)) {
      return false;
    }

    if (mapSpaceFromObject[this.objects[position]!]! !== mapSpace.open) {
      return false;
    }

    const flagPosition = this.move(position, "DownRight");
    if (!this.hasFlag(flagPosition) && !this.canBuildFlag(flagPosition, player)) {
      return false;
    }

    if (smallBuildingTypes.includes(type)) {
      if (!this.canBuildSmall(position)) {
        return false;
      }
    } else if (mineBuildingTypes.includes(type)) {
      if (!this.canBuildMine(position)) {
        return false;
      }
    } else if (!this.canBuildLarge(position)) {
      return false;
    }

    if (militaryBuildingTypes.includes(type) && !this.canBuildMilitary(position)) {
      return false;
    }

    return true;
  }

  buildBuilding(
    position: number,
    type: BuildingTypeValue,
    player: number,
    atTick = 0,
  ): WorldBuilding | null {
    if (!this.canBuildBuilding(position, type, player)) {
      return null;
    }

    const flagPosition = this.move(position, "DownRight");
    let flag = this.flagAt(flagPosition);
    if (flag === null) {
      flag = this.buildFlag(flagPosition, player);
      if (flag === null) {
        return null;
      }
    }

    const building: WorldBuilding = {
      index: this.#nextBuildingIndex,
      position,
      player,
      type,
      flagIndex: flag.index,
      levelHeight: this.levelingHeight(position),
      isDone: false,
      progress: 0,
      startTick: atTick,
      deliveredResources: {},
      requestedResources: {},
      builderTicks: 0,
      consumedMaterials: 0,
      knights: 0,
      requestedKnights: 0,
      threatLevel: 0,
    };
    this.#nextBuildingIndex += 1;
    this.buildings.set(building.index, building);
    flag.buildingIndex = building.index;

    const objectValue = smallBuildingTypes.includes(type) || mineBuildingTypes.includes(type)
      ? mapObject.smallBuilding
      : mapObject.largeBuilding;
    this.setObject(position, objectValue, building.index);
    this.addPath(position, "DownRight");
    this.addPath(flagPosition, "UpLeft");

    return building;
  }

  // --- castle (Game.BuildCastle) ---------------------------------------------------

  canBuildCastle(position: number, player: number): boolean {
    if (this.players[player]!.hasCastle) {
      return false;
    }

    for (let i = 0; i < 7; i += 1) {
      if (this.hasOwner(this.positionAddSpirally(position, i))) {
        return false;
      }
    }

    if (
      mapSpaceFromObject[this.objects[position]!]! !== mapSpace.open ||
      this.pathsAt(position) !== 0
    ) {
      return false;
    }

    const flagPosition = this.move(position, "DownRight");
    if (
      mapSpaceFromObject[this.objects[flagPosition]!]! !== mapSpace.open ||
      this.pathsAt(flagPosition) !== 0
    ) {
      return false;
    }

    return this.canBuildLarge(position);
  }

  buildCastle(position: number, player: number): WorldBuilding | null {
    if (!this.canBuildCastle(position, player)) {
      return null;
    }

    const flagPosition = this.move(position, "DownRight");
    const flag = this.#allocateFlag(flagPosition, player);
    flag.hasInventory = true;

    const castle: WorldBuilding = {
      index: this.#nextBuildingIndex,
      position,
      player,
      type: buildingType.castle,
      flagIndex: flag.index,
      levelHeight: this.levelingHeight(position),
      isDone: true,
      progress: 0,
      startTick: 0,
      deliveredResources: {},
      requestedResources: {},
      builderTicks: 0,
      consumedMaterials: 0,
      knights: 0,
      requestedKnights: 0,
      threatLevel: 0,
    };
    this.#nextBuildingIndex += 1;
    this.buildings.set(castle.index, castle);
    flag.buildingIndex = castle.index;

    // Level land in hexagon below castle.
    const height = castle.levelHeight;
    this.heights[position] = height;
    for (const direction of directionOrder) {
      this.heights[this.move(position, direction)] = height;
    }

    this.setObject(position, mapObject.castle, castle.index);
    this.addPath(position, "DownRight");
    this.setObject(flagPosition, mapObject.flag, flag.index);
    this.addPath(flagPosition, "UpLeft");

    this.players[player]!.hasCastle = true;
    this.players[player]!.castlePosition = position;

    // The castle is the player's first inventory (Game.BuildCastle allocates
    // it with the initial-supplies preset from the game-setup setting).
    const inventory = createInventory(
      this.inventories.size + 1,
      player,
      castle.index,
      flag.index,
      this.playerSupplies?.[player] ?? this.initialSupplies,
    );
    this.inventories.set(inventory.index, inventory);

    this.updateLandOwnership(position);

    return castle;
  }

  inventoryForPlayer(player: number): WorldInventory | null {
    for (const inventory of this.inventories.values()) {
      if (inventory.player === player) {
        return inventory;
      }
    }

    return null;
  }

  // Serf-driven construction (SB-13-04): the builder's work advances the
  // site through leveling, then consumes delivered materials until done.
  applyBuilderWork(building: WorldBuilding, workTicks: number): boolean {
    if (building.isDone) {
      return false;
    }

    building.builderTicks += workTicks;
    let changed = false;

    const [planks, stones] = buildingConstructionCosts[building.type] ?? [0, 0];
    const totalMaterials = planks + stones;
    const delivered = Object.values(building.deliveredResources).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (building.builderTicks >= constructionLevelingTicks && building.progress === 0) {
      building.progress = 1;
      changed = true;
    }

    if (building.progress >= 1) {
      const buildableTicks = building.builderTicks - constructionLevelingTicks;
      const consumable = Math.min(
        Math.trunc(buildableTicks / constructionTicksPerMaterial),
        delivered,
        totalMaterials,
      );
      if (consumable > building.consumedMaterials) {
        building.consumedMaterials = consumable;
        changed = true;
      }

      if (building.consumedMaterials >= totalMaterials) {
        building.isDone = true;
        changed = true;
      }
    }

    return changed;
  }

  // Flag.DropResource: place a resource into the first empty slot.
  dropResource(flagIndex: number, resource: number, destinationFlagIndex: number): boolean {
    const flag = this.flags.get(flagIndex);
    if (flag === undefined) {
      return false;
    }

    for (const slot of flag.slots) {
      if (slot.resource < 0) {
        slot.resource = resource;
        slot.destinationFlagIndex = destinationFlagIndex;
        slot.scheduledDirection = null;
        return true;
      }
    }

    return false;
  }

  // --- conquest (Game.OccupyEnemyBuilding / DemolishBuilding) -------------------------

  // Clear a road's path bits along its whole length and disconnect the
  // flag records at both ends (Game.DemolishRoad, structural subset).
  demolishRoad(flag: WorldFlag, direction: Direction): void {
    const path = flag.paths[direction];
    if (!path.hasPath) {
      return;
    }

    const otherFlag = this.flags.get(path.otherFlagIndex);
    let position = flag.position;
    let currentDirection: Direction = direction;
    for (;;) {
      this.deletePath(position, currentDirection);
      const next = this.move(position, currentDirection);
      this.deletePath(next, reverseOf[currentDirection]);
      position = next;
      if (this.hasFlag(position) || this.pathsAt(position) === 0) {
        break;
      }

      let following: Direction | null = null;
      for (const checkDirection of directionOrder) {
        if (this.hasPath(position, checkDirection)) {
          following = checkDirection;
          break;
        }
      }

      if (following === null) {
        break;
      }

      currentDirection = following;
    }

    if (otherFlag !== undefined && path.otherEndDirection !== null) {
      const otherPath = otherFlag.paths[path.otherEndDirection];
      otherPath.hasPath = false;
      otherPath.otherFlagIndex = 0;
      otherPath.freeTransporters = 0;
    }

    path.hasPath = false;
    path.otherFlagIndex = 0;
    path.freeTransporters = 0;
  }

  // Remove a building, keeping its flag (Game.DemolishBuilding, condensed).
  demolishBuildingAt(position: number): boolean {
    const building = this.buildingAt(position);
    if (building === null) {
      return false;
    }

    const flagPosition = this.move(position, "DownRight");
    this.deletePath(position, "DownRight");
    this.deletePath(flagPosition, "UpLeft");
    const flag = this.flags.get(building.flagIndex);
    if (flag !== undefined) {
      flag.buildingIndex = null;
    }

    this.setObject(position, mapObject.none, 0);
    this.objectIndexes[position] = 0;
    this.buildings.delete(building.index);

    if (building.type === buildingType.castle) {
      const player = this.players[building.player]!;
      player.hasCastle = false;
      player.castlePosition = null;
      player.defeated = true;
      for (const [index, inventory] of this.inventories) {
        if (inventory.buildingIndex === building.index) {
          this.inventories.delete(index);
        }
      }
    }

    return true;
  }

  // Game.OccupyEnemyBuilding: a conquering knight takes the post. The
  // castle is demolished outright (defeat); a military building transfers
  // with its flag, the immediate ring changes owner, surrounding civilian
  // buildings fall, and the captured flag's roads are cut.
  captureBuilding(buildingIndex: number, playerIndex: number): boolean {
    const building = this.buildings.get(buildingIndex);
    if (building === undefined || building.player === playerIndex) {
      return false;
    }

    if (building.type === buildingType.castle) {
      const position = building.position;
      this.demolishBuildingAt(position);
      this.updateLandOwnership(position);
      return true;
    }

    if (!militaryBuildingTypes.includes(building.type)) {
      return false;
    }

    const flag = this.flags.get(building.flagIndex);
    if (flag === undefined) {
      return false;
    }

    // Stolen resources lose their destinations.
    for (const slot of flag.slots) {
      slot.destinationFlagIndex = 0;
      slot.scheduledDirection = null;
    }

    // Demolish civilian buildings in the second ring.
    for (let i = 0; i < 12; i += 1) {
      const position = this.positionAddSpirally(building.position, 7 + i);
      const objectValue = this.objects[position]!;
      if (objectValue >= mapObject.smallBuilding && objectValue < mapObject.castle) {
        this.demolishBuildingAt(position);
      }
    }

    // The post, its ring, and its flag change owner.
    this.owners[building.position] = playerIndex;
    for (const direction of directionOrder) {
      const position = this.move(building.position, direction);
      this.owners[position] = playerIndex;
    }

    // The conquering knight occupies the post before the ownership
    // recompute (reference KnightOccupy), so the post projects influence.
    building.player = playerIndex;
    building.knights = 1;
    building.requestedKnights = 0;
    flag.player = playerIndex;

    // Cut the captured flag's roads — the new owner connects it afresh.
    for (const direction of directionOrder) {
      if (direction !== "UpLeft" && flag.paths[direction].hasPath) {
        this.demolishRoad(flag, direction);
      }
    }

    this.updateLandOwnership(building.position);
    return true;
  }

  // --- knight morale (Player.UpdateKnightMorale) --------------------------------------

  // Game init: MapGoldMoraleFactor = 10 * 1024 * player count.
  mapGoldMoraleFactor(): number {
    return 10 * 1024 * this.players.length;
  }

  // Game.GoldTotal, condensed: unmined map gold plus gold already in the
  // economy (ore and bars held in inventories). The reference seeds the
  // total from the map deposit at game start and adjusts as gold is lost;
  // recomputing keeps the same invariant without the bookkeeping.
  goldTotal(): number {
    let total = 0;
    for (let position = 0; position < this.minerals.length; position += 1) {
      if (this.minerals[position] === 1) {
        total += this.resourceAmounts[position]!;
      }
    }

    for (const inventory of this.inventories.values()) {
      total += inventory.resources[13]! + inventory.resources[14]!;
    }

    for (const building of this.buildings.values()) {
      if (militaryBuildingTypes.includes(building.type)) {
        total += building.deliveredResources[14] ?? 0;
      }
    }

    return total;
  }

  updateKnightMorale(playerIndex: number): void {
    const player = this.players[playerIndex];
    if (player === undefined) {
      return;
    }

    let inventoryGold = 0;
    for (const inventory of this.inventories.values()) {
      if (inventory.player === playerIndex) {
        inventoryGold += inventory.resources[14]!;
      }
    }

    let militaryGold = 0;
    for (const building of this.buildings.values()) {
      if (building.player === playerIndex && militaryBuildingTypes.includes(building.type)) {
        militaryGold += building.deliveredResources[14] ?? 0;
      }
    }

    let depot = inventoryGold + militaryGold;
    player.goldDeposited = depot;

    let totalGold = this.goldTotal();
    if (totalGold !== 0) {
      while (totalGold > 0xffff) {
        totalGold >>= 1;
        depot >>= 1;
      }

      depot = Math.min(depot, totalGold - 1);
      player.knightMorale = 1024 + Math.trunc((this.mapGoldMoraleFactor() * depot) / totalGold);
    } else {
      player.knightMorale = 4096;
    }
  }

  // --- land ownership (Game.UpdateLandOwnership) -------------------------------------

  updateLandOwnership(position: number): void {
    const influenceRadius = 8;
    const influenceDiameter = 1 + 2 * influenceRadius;
    const calculateRadius = influenceRadius;
    const calculateDiameter = 1 + 2 * calculateRadius;
    const playerCount = this.players.length;
    const tempArray = new Int32Array(calculateDiameter * calculateDiameter * playerCount);

    for (let i = -(influenceRadius + calculateRadius); i <= influenceRadius + calculateRadius; i += 1) {
      for (let j = -(influenceRadius + calculateRadius); j <= influenceRadius + calculateRadius; j += 1) {
        const checkPosition = this.geometry.positionAdd(position, j, i);

        if (this.hasBuilding(checkPosition)) {
          const building = this.buildingAt(checkPosition);
          if (building === null) {
            continue;
          }

          let militaryType = -1;
          if (building.type === buildingType.castle) {
            militaryType = 2;
          } else if (building.isDone && building.knights > 0) {
            // Reference IsActive: military buildings project territory only
            // while occupied by at least one knight.
            if (building.type === buildingType.hut) militaryType = 0;
            else if (building.type === buildingType.tower) militaryType = 1;
            else if (building.type === buildingType.fortress) militaryType = 2;
          }

          if (militaryType >= 0) {
            const influenceOffset = 10 * militaryType;
            let closenessOffset = influenceDiameter * Math.max(-i, 0) + Math.max(-j, 0);
            let arrayIndex =
              building.player * calculateDiameter * calculateDiameter +
              calculateDiameter * Math.max(i, 0) +
              Math.max(j, 0);

            for (let k = 0; k < influenceDiameter - Math.abs(i); k += 1) {
              for (let l = 0; l < influenceDiameter - Math.abs(j); l += 1) {
                const influence = militaryInfluence[influenceOffset + mapCloseness[closenessOffset]!]!;

                if (influence < 0) {
                  tempArray[arrayIndex] = 128;
                } else if (tempArray[arrayIndex]! < 128) {
                  tempArray[arrayIndex] = Math.min(tempArray[arrayIndex]! + influence, 127);
                }

                closenessOffset += 1;
                arrayIndex += 1;
              }

              closenessOffset += Math.abs(j);
              arrayIndex += Math.abs(j);
            }
          }
        }
      }
    }

    for (let i = -calculateRadius; i <= calculateRadius; i += 1) {
      for (let j = -calculateRadius; j <= calculateRadius; j += 1) {
        let maxValue = 0;
        let playerIndex = -1;

        for (const player of this.players) {
          const arrayIndex =
            player.index * calculateDiameter * calculateDiameter +
            calculateDiameter * (i + calculateRadius) +
            (j + calculateRadius);
          if (tempArray[arrayIndex]! > maxValue) {
            maxValue = tempArray[arrayIndex]!;
            playerIndex = player.index;
          }
        }

        const checkPosition = this.geometry.positionAdd(position, j, i);
        const oldPlayer = this.owners[checkPosition]!;

        if (oldPlayer >= 0 && playerIndex !== oldPlayer) {
          this.players[oldPlayer]!.landArea -= 1;
          // Reference SurrenderLand demolishes losing structures; multi-player
          // capture arrives in Phase 15.
        }

        if (playerIndex >= 0) {
          if (playerIndex !== oldPlayer) {
            this.players[playerIndex]!.landArea += 1;
            this.owners[checkPosition] = playerIndex;
          }
        } else {
          this.owners[checkPosition] = -1;
        }
      }
    }
  }

  // --- borders (for rendering) ------------------------------------------------------

  borderSegments(): { position: number; direction: Direction }[] {
    const segments: { position: number; direction: Direction }[] = [];
    const borderDirections: readonly Direction[] = ["Right", "DownRight", "Down"];
    for (let position = 0; position < this.paths.length; position += 1) {
      for (const direction of borderDirections) {
        const other = this.move(position, direction);
        if (this.owners[position] !== this.owners[other]!) {
          segments.push({ position, direction });
        }
      }
    }

    return segments;
  }
}
