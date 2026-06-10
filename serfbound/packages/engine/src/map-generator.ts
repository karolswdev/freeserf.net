import { FreeserfRandom, MapGeometry, type Direction } from "./index.js";

// Classic map generator ported from Freeserf.Core/MapGenerator.cs
// (ClassicMissionMapGenerator: Midpoints height generator, preserveBugs=true).
// Preserved reference quirks are marked with "reference quirk" comments; they
// are required to reproduce original maps and the committed oracle fixture.

export const mapTerrain = {
  water0: 0,
  water1: 1,
  water2: 2,
  water3: 3,
  grass0: 4,
  grass1: 5,
  grass2: 6,
  grass3: 7,
  desert0: 8,
  desert1: 9,
  desert2: 10,
  tundra0: 11,
  tundra1: 12,
  tundra2: 13,
  snow0: 14,
  snow1: 15,
} as const;

export const mapObject = {
  none: 0,
  flag: 1,
  smallBuilding: 2,
  largeBuilding: 3,
  castle: 4,
  tree0: 8,
  pine0: 16,
  palm0: 24,
  waterTree0: 28,
  stone0: 72,
  sandstone0: 80,
  cross: 82,
  stub: 83,
  stone: 84,
  cadaver0: 86,
  waterStone0: 88,
  cactus0: 90,
  deadTree: 92,
} as const;

export const mapMinerals = {
  none: 0,
  gold: 1,
  iron: 2,
  coal: 3,
  stone: 4,
} as const;

export const mapSpace = {
  open: 0,
  filled: 1,
  semipassable: 2,
  impassable: 3,
} as const;

// Map.MapSpaceFromObject from Freeserf.Core/Map.cs (index = object value).
export const mapSpaceFromObject: readonly number[] = (() => {
  const spaces = new Array<number>(128).fill(mapSpace.open);
  spaces[1] = mapSpace.filled; // flag
  spaces[2] = mapSpace.impassable; // small building
  spaces[3] = mapSpace.impassable; // large building
  spaces[4] = mapSpace.impassable; // castle
  for (let value = 8; value < 28; value += 1) spaces[value] = mapSpace.filled; // trees/pines/palms
  for (let value = 28; value < 32; value += 1) spaces[value] = mapSpace.impassable; // water trees
  for (let value = 72; value < 82; value += 1) spaces[value] = mapSpace.impassable; // stones/sandstone
  spaces[82] = mapSpace.filled; // cross
  spaces[88] = mapSpace.impassable; // water stone 0
  spaces[89] = mapSpace.impassable; // water stone 1
  spaces[90] = mapSpace.filled; // cactus 0
  spaces[91] = mapSpace.filled; // cactus 1
  spaces[92] = mapSpace.filled; // dead tree
  for (let value = 93; value < 97; value += 1) spaces[value] = mapSpace.filled; // felled pine 0-3
  for (let value = 98; value < 102; value += 1) spaces[value] = mapSpace.filled; // felled tree 0-3
  spaces[103] = mapSpace.filled; // new pine
  spaces[104] = mapSpace.filled; // new tree
  for (let value = 105; value < 111; value += 1) spaces[value] = mapSpace.semipassable; // seeds
  return spaces;
})();

// Map.SpiralPattern base ring entries from Freeserf.Core/Map.cs.
const spiralPatternBase = [
  0, 0,
  1, 0, 2, 1, 2, 0, 3, 1, 3, 2, 3, 0, 4, 2, 4, 1, 4, 3, 4, 0,
  5, 2, 5, 3, 5, 1, 5, 4, 5, 0, 6, 3, 6, 2, 6, 4, 6, 1, 6, 5,
  6, 0, 7, 3, 7, 4, 7, 2, 7, 5, 7, 1, 7, 6, 7, 0, 8, 4, 8, 3,
  8, 5, 8, 2, 8, 6, 8, 1, 8, 7, 8, 0, 9, 4, 9, 5, 9, 3, 9, 6,
  9, 2, 9, 7, 9, 1, 9, 0, 16, 0, 16, 8, 24, 0, 24, 8, 24, 16,
] as const;

const spiralMatrix = [
  1, 0, 0, 1,
  1, 1, -1, 0,
  0, 1, -1, -1,
  -1, 0, 0, -1,
  -1, -1, 1, 0,
  0, -1, 1, 1,
] as const;

export const classicSpiralPattern: readonly (readonly [number, number])[] = (() => {
  const pattern: [number, number][] = [[0, 0]];
  for (let ring = 0; ring < 49; ring += 1) {
    const x = spiralPatternBase[2 + 2 * ring] ?? 0;
    const y = spiralPatternBase[2 + 2 * ring + 1] ?? 0;
    for (let rotation = 0; rotation < 6; rotation += 1) {
      pattern.push([
        x * (spiralMatrix[4 * rotation] ?? 0) + y * (spiralMatrix[4 * rotation + 2] ?? 0),
        x * (spiralMatrix[4 * rotation + 1] ?? 0) + y * (spiralMatrix[4 * rotation + 3] ?? 0),
      ]);
    }
  }

  return pattern.slice(0, 295);
})();

export type ClassicMapLandscape = {
  readonly size: number;
  readonly columns: number;
  readonly rows: number;
  readonly tileCount: number;
  readonly heights: Uint8Array;
  readonly typesUp: Uint8Array;
  readonly typesDown: Uint8Array;
  readonly objects: Uint8Array;
  readonly minerals: Uint8Array;
  readonly resourceAmounts: Uint8Array;
};

export type ClassicMapGeneratorOptions = {
  readonly maxLakeArea?: number;
  readonly waterLevel?: number;
  readonly terrainSpikyness?: number;
};

// Clockwise direction cycles in reference enum order (Right=0 .. Up=5),
// written as literals to avoid a module-evaluation cycle with the index.
const clockwiseFromRight: readonly Direction[] = ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"];
const clockwiseFromDown: readonly Direction[] = ["Down", "Left", "UpLeft", "Up", "Right", "DownRight"];
const clockwiseLeftThree: readonly Direction[] = ["Left", "UpLeft", "Up"];

export function generateClassicMap(
  size: number,
  seedBases: readonly [number, number, number],
  options: ClassicMapGeneratorOptions = {},
): ClassicMapLandscape {
  const geometry = new MapGeometry(size);
  const tileCount = geometry.dimensions.tileCount;
  const columns = geometry.dimensions.columns;
  const rows = geometry.dimensions.rows;
  const columnMask = columns - 1;
  const rowMask = rows - 1;

  const maxLakeArea = options.maxLakeArea ?? 14;
  const waterLevel = options.waterLevel ?? 20;
  const terrainSpikyness = options.terrainSpikyness ?? 0x9999;
  const regionCount = (columns >> 5) * (rows >> 5);

  const heights = new Int32Array(tileCount);
  const typesUp = new Uint8Array(tileCount);
  const typesDown = new Uint8Array(tileCount);
  const objects = new Uint8Array(tileCount);
  const minerals = new Uint8Array(tileCount);
  const resourceAmounts = new Uint8Array(tileCount);
  const tags = new Int32Array(tileCount);

  const spiralPositions = classicSpiralPattern.map(([x, y]) =>
    geometry.position(x & columnMask, y & rowMask),
  );

  let random = FreeserfRandom.xor(
    FreeserfRandom.fromState(seedBases[0], seedBases[1], seedBases[2]),
    FreeserfRandom.fromState(0x5a5a, 0xa5a5, 0xc3c3),
  );
  const randomInt = (): number => random.next();

  const position = (column: number, row: number): number => geometry.position(column, row);
  const move = (pos: number, direction: Direction): number => geometry.move(pos, direction);
  const moveRight = (pos: number): number => geometry.moveRight(pos);
  const moveDown = (pos: number): number => geometry.moveDown(pos);
  const moveDownRight = (pos: number): number => geometry.moveDownRight(pos);
  const moveLeft = (pos: number): number => geometry.moveLeft(pos);
  const moveUp = (pos: number): number => geometry.moveUp(pos);
  const moveUpLeft = (pos: number): number => geometry.moveUpLeft(pos);
  const moveRightN = (pos: number, count: number): number => geometry.moveRightN(pos, count);
  const moveDownN = (pos: number, count: number): number => geometry.moveDownN(pos, count);
  const positionAddSpirally = (pos: number, offset: number): number => {
    const spiralPosition = spiralPositions[offset];
    if (spiralPosition === undefined) {
      throw new Error(`Spiral offset ${offset} exceeds the classic 295-entry pattern.`);
    }

    return geometry.positionAddOffset(pos, spiralPosition);
  };
  const getRandomCoordinate = (): number => {
    const column = randomInt() & columnMask;
    const row = randomInt() & rowMask;
    return position(column, row);
  };
  const positionColumn = (pos: number): number => pos & columnMask;
  const positionRow = (pos: number): number => (pos >>> geometry.dimensions.rowShift) & rowMask;

  const isWaterTile = (pos: number): boolean =>
    typesDown[pos]! <= mapTerrain.water3 && typesUp[pos]! <= mapTerrain.water3;
  const isInWater = (pos: number): boolean =>
    isWaterTile(pos) &&
    isWaterTile(moveUpLeft(pos)) &&
    typesDown[moveLeft(pos)]! <= mapTerrain.water3 &&
    typesUp[moveUp(pos)]! <= mapTerrain.water3;

  // --- height generation ----------------------------------------------------

  randomInt();
  randomInt();

  for (let y = 0; y < rows; y += 16) {
    for (let x = 0; x < columns; x += 16) {
      heights[position(x, y)] = Math.min(randomInt() & 0xff, 250);
    }
  }

  const calcHeightDisplacement = (average: number, base: number, offset: number): number => {
    const height = ((randomInt() * base) >> 16) - offset + average;
    return Math.max(0, Math.min(height, 250));
  };

  const midpointRandomValue = randomInt();
  let r1 = 0x80 + (midpointRandomValue & 0x7f);
  let r2 = (r1 * terrainSpikyness) >> 16;

  for (let i = 8; i > 0; i >>= 1) {
    for (let y = 0; y < rows; y += 2 * i) {
      for (let x = 0; x < columns; x += 2 * i) {
        const pos = position(x, y);
        const height = heights[pos]!;

        let heightRight = heights[moveRightN(pos, 2 * i)]!;
        // Reference quirk: the very first midpoint keeps the upper random bits
        // in heightRight to reproduce original maps.
        if (x === 0 && y === 0 && i === 8) {
          heightRight |= midpointRandomValue & 0xff00;
        }

        heights[moveRightN(pos, i)] = calcHeightDisplacement(
          Math.trunc((height + heightRight) / 2),
          r1,
          r2,
        );

        const heightDown = heights[moveDownN(pos, 2 * i)]!;
        heights[moveDownN(pos, i)] = calcHeightDisplacement(
          Math.trunc((height + heightDown) / 2),
          r1,
          r2,
        );

        const heightDownRight = heights[moveRightN(moveDownN(pos, 2 * i), 2 * i)]!;
        heights[moveRightN(moveDownN(pos, i), i)] = calcHeightDisplacement(
          Math.trunc((height + heightDownRight) / 2),
          r1,
          r2,
        );
      }
    }

    r1 >>= 1;
    r2 >>= 1;
  }

  const adjustMapHeight = (height1: number, height2: number, pos: number): boolean => {
    if (Math.abs(height1 - height2) > 32) {
      heights[pos] = height1 + (height1 < height2 ? 32 : -32);
      return true;
    }

    return false;
  };

  let clampChanged = true;
  while (clampChanged) {
    clampChanged = false;
    for (let pos = 0; pos < tileCount; pos += 1) {
      const height = heights[pos]!;
      const posDown = moveDown(pos);
      clampChanged = adjustMapHeight(height, heights[posDown]!, posDown) || clampChanged;
      const posDownRight = moveDownRight(pos);
      clampChanged = adjustMapHeight(height, heights[posDownRight]!, posDownRight) || clampChanged;
      const posRight = moveRight(pos);
      clampChanged = adjustMapHeight(height, heights[posRight]!, posRight) || clampChanged;
    }
  }

  // --- water bodies -----------------------------------------------------------

  const expandWaterPosition = (pos: number): boolean => {
    let expanding = false;
    for (const direction of clockwiseFromRight) {
      const height = heights[move(pos, direction)]!;
      if (waterLevel < height && height < 254) {
        return false;
      }

      if (height === 255) {
        expanding = true;
      }
    }

    if (expanding) {
      heights[pos] = 255;
      for (const direction of clockwiseFromRight) {
        const newPosition = move(pos, direction);
        if (heights[newPosition] !== 255) {
          heights[newPosition] = 254;
        }
      }
    }

    return expanding;
  };

  const expandWaterBody = (pos: number): void => {
    for (const direction of clockwiseFromRight) {
      if (heights[move(pos, direction)]! > waterLevel) {
        heights[pos] = 0;
        return;
      }
    }

    heights[pos] = 255;
    for (const direction of clockwiseFromRight) {
      heights[move(pos, direction)] = 254;
    }

    for (let i = 0; i < maxLakeArea; i += 1) {
      let expanded = false;
      let newPosition = moveRightN(pos, i + 1);
      for (const direction of clockwiseFromDown) {
        for (let j = 0; j <= i; j += 1) {
          expanded = expandWaterPosition(newPosition) || expanded;
          newPosition = move(newPosition, direction);
        }
      }

      if (!expanded) {
        break;
      }
    }

    heights[pos] = heights[pos]! - 2;
    for (let i = 0; i < maxLakeArea + 1; i += 1) {
      let newPosition = moveRightN(pos, i + 1);
      for (const direction of clockwiseFromDown) {
        for (let j = 0; j <= i; j += 1) {
          if (heights[newPosition]! > 253) {
            heights[newPosition] = heights[newPosition]! - 2;
          }

          newPosition = move(newPosition, direction);
        }
      }
    }
  };

  for (let level = 0; level <= waterLevel; level += 1) {
    for (let pos = 0; pos < tileCount; pos += 1) {
      if (heights[pos] === level) {
        expandWaterBody(pos);
      }
    }
  }

  for (let pos = 0; pos < tileCount; pos += 1) {
    switch (heights[pos]) {
      case 0:
        heights[pos] = waterLevel + 1;
        break;
      case 252:
        heights[pos] = waterLevel;
        break;
      case 253:
        heights[pos] = waterLevel - 1;
        minerals[pos] = mapMinerals.none;
        resourceAmounts[pos] = randomInt() & 7; // fish
        break;
      default:
        break;
    }
  }

  for (let pos = 0; pos < tileCount; pos += 1) {
    heights[pos] = heights[pos]! - (waterLevel - 1);
  }

  // --- terrain types ----------------------------------------------------------

  const calcMapType = (heightSum: number): number => {
    if (heightSum < 3) return mapTerrain.water0;
    if (heightSum < 384) return mapTerrain.grass1;
    if (heightSum < 416) return mapTerrain.grass2;
    if (heightSum < 448) return mapTerrain.tundra0;
    if (heightSum < 480) return mapTerrain.tundra1;
    if (heightSum < 528) return mapTerrain.tundra2;
    if (heightSum < 560) return mapTerrain.snow0;
    return mapTerrain.snow1;
  };

  for (let pos = 0; pos < tileCount; pos += 1) {
    const h1 = heights[pos]!;
    const h2 = heights[moveRight(pos)]!;
    const h3 = heights[moveDownRight(pos)]!;
    const h4 = heights[moveDown(pos)]!;
    typesUp[pos] = calcMapType(h1 + h3 + h4);
    typesDown[pos] = calcMapType(h1 + h2 + h3);
  }

  // --- island removal ---------------------------------------------------------

  for (let pos = 0; pos < tileCount; pos += 1) {
    if (heights[pos]! > 0 && tags[pos] === 0) {
      tags[pos] = 1;

      let num = 0;
      let changed = true;
      while (changed) {
        changed = false;
        for (let other = 0; other < tileCount; other += 1) {
          if (tags[other] === 1) {
            num += 1;
            tags[other] = 2;

            let flags = 0;
            if (typesDown[other]! >= mapTerrain.grass0) flags |= 3;
            if (typesUp[other]! >= mapTerrain.grass0) flags |= 6;
            if (typesDown[moveLeft(other)]! >= mapTerrain.grass0) flags |= 0xc;
            if (typesUp[moveUpLeft(other)]! >= mapTerrain.grass0) flags |= 0x18;
            if (typesDown[moveUpLeft(other)]! >= mapTerrain.grass0) flags |= 0x30;
            if (typesUp[moveUp(other)]! >= mapTerrain.grass0) flags |= 0x21;

            for (let directionIndex = 0; directionIndex < 6; directionIndex += 1) {
              if ((flags >> directionIndex) & 1) {
                const moved = move(other, clockwiseFromRight[directionIndex]!);
                if (tags[moved] === 0) {
                  tags[moved] = 1;
                  changed = true;
                }
              }
            }
          }
        }
      }

      if (4 * num >= tileCount) {
        break;
      }
    }
  }

  for (let pos = 0; pos < tileCount; pos += 1) {
    if (heights[pos]! > 0 && tags[pos] === 0) {
      heights[pos] = 0;
      // Reference quirk: TypeUp is assigned twice in the original; the tile's
      // own TypeDown is intentionally left unchanged.
      typesUp[pos] = mapTerrain.water0;
      typesUp[pos] = mapTerrain.water0;
      typesDown[moveLeft(pos)] = mapTerrain.water0;
      typesUp[moveUpLeft(pos)] = mapTerrain.water0;
      typesDown[moveUpLeft(pos)] = mapTerrain.water0;
      typesUp[moveUp(pos)] = mapTerrain.water0;
    }
  }

  for (let pos = 0; pos < tileCount; pos += 1) {
    heights[pos] = (heights[pos]! + 5) >> 3;
  }

  // --- shore and desert types --------------------------------------------------

  const seedTerrainType = (old: number, seed: number, replacement: number): void => {
    for (let pos = 0; pos < tileCount; pos += 1) {
      if (
        typesUp[pos] === old &&
        (seed === typesDown[moveUpLeft(pos)] ||
          seed === typesUp[moveUpLeft(pos)] ||
          seed === typesUp[moveUp(pos)] ||
          seed === typesDown[moveLeft(pos)] ||
          seed === typesUp[moveLeft(pos)] ||
          seed === typesDown[pos] ||
          seed === typesUp[moveRight(pos)] ||
          seed === typesDown[moveLeft(moveDown(pos))] ||
          seed === typesDown[moveDown(pos)] ||
          seed === typesUp[moveDown(pos)] ||
          seed === typesDown[moveDownRight(pos)] ||
          seed === typesUp[moveDownRight(pos)])
      ) {
        typesUp[pos] = replacement;
      }

      if (
        typesDown[pos] === old &&
        (seed === typesDown[moveUpLeft(pos)] ||
          seed === typesUp[moveUpLeft(pos)] ||
          seed === typesDown[moveUp(pos)] ||
          seed === typesUp[moveUp(pos)] ||
          seed === typesUp[moveRight(moveUp(pos))] ||
          seed === typesDown[moveLeft(pos)] ||
          seed === typesUp[pos] ||
          seed === typesDown[moveRight(pos)] ||
          seed === typesUp[moveRight(pos)] ||
          seed === typesDown[moveDown(pos)] ||
          seed === typesDown[moveDownRight(pos)] ||
          seed === typesUp[moveDownRight(pos)])
      ) {
        typesDown[pos] = replacement;
      }
    }
  };

  seedTerrainType(mapTerrain.water0, mapTerrain.grass1, mapTerrain.water3);
  seedTerrainType(mapTerrain.water0, mapTerrain.water3, mapTerrain.water2);
  seedTerrainType(mapTerrain.water0, mapTerrain.water2, mapTerrain.water1);
  seedTerrainType(mapTerrain.grass1, mapTerrain.water3, mapTerrain.grass0);

  const checkDesertDownTriangle = (pos: number): boolean => {
    const isDesertable = (terrain: number): boolean =>
      terrain === mapTerrain.grass1 || terrain === mapTerrain.desert2;
    return (
      isDesertable(typesDown[pos]!) &&
      isDesertable(typesUp[pos]!) &&
      isDesertable(typesDown[moveLeft(pos)]!) &&
      isDesertable(typesDown[moveDown(pos)]!)
    );
  };

  const checkDesertUpTriangle = (pos: number): boolean => {
    const isDesertable = (terrain: number): boolean =>
      terrain === mapTerrain.grass1 || terrain === mapTerrain.desert2;
    return (
      isDesertable(typesDown[pos]!) &&
      isDesertable(typesUp[pos]!) &&
      isDesertable(typesUp[moveRight(pos)]!) &&
      isDesertable(typesUp[moveUp(pos)]!)
    );
  };

  for (let region = 0; region < regionCount; region += 1) {
    for (let tryIndex = 0; tryIndex < 200; tryIndex += 1) {
      const randomPosition = getRandomCoordinate();

      if (
        typesUp[randomPosition] === mapTerrain.grass1 &&
        typesDown[randomPosition] === mapTerrain.grass1
      ) {
        for (let index = 255; index >= 0; index -= 1) {
          const pos = positionAddSpirally(randomPosition, index);
          if (checkDesertDownTriangle(pos)) {
            typesUp[pos] = mapTerrain.desert2;
          }

          if (checkDesertUpTriangle(pos)) {
            typesDown[pos] = mapTerrain.desert2;
          }
        }

        break;
      }
    }
  }

  seedTerrainType(mapTerrain.desert2, mapTerrain.grass1, mapTerrain.grass3);
  seedTerrainType(mapTerrain.desert2, mapTerrain.grass3, mapTerrain.desert0);
  seedTerrainType(mapTerrain.desert2, mapTerrain.desert0, mapTerrain.desert1);

  for (let pos = 0; pos < tileCount; pos += 1) {
    if (typesDown[pos]! >= mapTerrain.grass3 && typesDown[pos]! <= mapTerrain.desert1) {
      typesDown[pos] = mapTerrain.grass1;
    }

    if (typesUp[pos]! >= mapTerrain.grass3 && typesUp[pos]! <= mapTerrain.desert1) {
      typesUp[pos] = mapTerrain.grass1;
    }
  }

  seedTerrainType(mapTerrain.grass1, mapTerrain.desert2, mapTerrain.desert1);
  seedTerrainType(mapTerrain.grass1, mapTerrain.desert1, mapTerrain.desert0);
  seedTerrainType(mapTerrain.grass1, mapTerrain.desert0, mapTerrain.grass3);

  // --- objects ------------------------------------------------------------------

  for (let pos = 0; pos < tileCount; pos += 1) {
    const height = heights[pos]!;
    if (
      height >= 26 &&
      height >= heights[moveRight(pos)]! &&
      height >= heights[moveDownRight(pos)]! &&
      height >= heights[moveDown(pos)]! &&
      height > heights[moveLeft(pos)]! &&
      height > heights[moveUpLeft(pos)]! &&
      height > heights[moveUp(pos)]!
    ) {
      objects[pos] = mapObject.cross;
    }
  }

  const hexagonTypesInRange = (pos: number, typeMin: number, typeMax: number): boolean => {
    const inRange = (terrain: number): boolean => terrain >= typeMin && terrain <= typeMax;

    if (!inRange(typesDown[pos]!) || !inRange(typesUp[pos]!)) return false;
    if (!inRange(typesDown[moveLeft(pos)]!)) return false;
    if (!inRange(typesDown[moveUpLeft(pos)]!) || !inRange(typesUp[moveUpLeft(pos)]!)) return false;
    // Reference quirk (preserveBugs): checks the down type of the up tile
    // instead of its up type.
    if (!inRange(typesDown[moveUp(pos)]!)) return false;
    return true;
  };

  const createRandomObjectClusters = (
    numClusters: number,
    objectsInCluster: number,
    positionMask: number,
    typeMin: number,
    typeMax: number,
    objectBase: number,
    objectMask: number,
  ): void => {
    for (let cluster = 0; cluster < numClusters; cluster += 1) {
      for (let tryIndex = 0; tryIndex < 100; tryIndex += 1) {
        const randomPosition = getRandomCoordinate();
        if (hexagonTypesInRange(randomPosition, typeMin, typeMax)) {
          for (let index = 0; index < objectsInCluster; index += 1) {
            const pos = positionAddSpirally(randomPosition, randomInt() & positionMask);
            if (hexagonTypesInRange(pos, typeMin, typeMax) && objects[pos] === mapObject.none) {
              objects[pos] = objectBase + (randomInt() & objectMask);
            }
          }

          break;
        }
      }
    }
  };

  createRandomObjectClusters(regionCount * 8, 10, 0xff, mapTerrain.grass1, mapTerrain.grass2, mapObject.tree0, 0xf);
  createRandomObjectClusters(regionCount, 45, 0x3f, mapTerrain.grass1, mapTerrain.grass2, mapObject.tree0, 0x7);
  createRandomObjectClusters(regionCount, 30, 0x3f, mapTerrain.grass0, mapTerrain.grass2, mapObject.pine0, 0x7);
  createRandomObjectClusters(regionCount, 20, 0x7f, mapTerrain.grass1, mapTerrain.grass2, mapObject.tree0, 0xf);
  createRandomObjectClusters(regionCount, 40, 0x3f, mapTerrain.grass1, mapTerrain.grass2, mapObject.stone0, 0x7);
  createRandomObjectClusters(regionCount, 15, 0xff, mapTerrain.grass1, mapTerrain.grass2, mapObject.stone0, 0x7);
  createRandomObjectClusters(regionCount, 2, 0xff, mapTerrain.grass1, mapTerrain.grass2, mapObject.deadTree, 0);
  createRandomObjectClusters(regionCount, 6, 0xff, mapTerrain.grass1, mapTerrain.grass2, mapObject.sandstone0, 0x1);
  createRandomObjectClusters(regionCount, 50, 0x7f, mapTerrain.water2, mapTerrain.water3, mapObject.waterTree0, 0x3);
  createRandomObjectClusters(regionCount, 5, 0xff, mapTerrain.grass1, mapTerrain.grass2, mapObject.stub, 0);
  createRandomObjectClusters(regionCount, 10, 0xff, mapTerrain.grass1, mapTerrain.grass2, mapObject.stone, 0x1);
  createRandomObjectClusters(regionCount, 2, 0xf, mapTerrain.desert2, mapTerrain.desert2, mapObject.cadaver0, 0x1);
  createRandomObjectClusters(regionCount, 6, 0x7f, mapTerrain.desert0, mapTerrain.desert2, mapObject.cactus0, 0x1);
  createRandomObjectClusters(regionCount, 8, 0x7f, mapTerrain.water0, mapTerrain.water2, mapObject.waterStone0, 0x1);
  createRandomObjectClusters(regionCount, 6, 0x3f, mapTerrain.desert2, mapTerrain.desert2, mapObject.palm0, 0x3);

  // --- minerals -------------------------------------------------------------------

  const mineralIterations = [1, 6, 12, 18, 24, 30] as const;

  const expandMineralCluster = (
    iterations: number,
    initialPosition: number,
    startIndex: number,
    amount: number,
    mineral: number,
  ): number => {
    let index = startIndex;
    for (let i = 0; i < iterations; i += 1) {
      const pos = positionAddSpirally(initialPosition, index);
      index += 1;
      if (minerals[pos] === mapMinerals.none || resourceAmounts[pos]! < amount) {
        minerals[pos] = mineral;
        resourceAmounts[pos] = amount;
      }
    }

    return index;
  };

  const createRandomMineralClusters = (
    numClusters: number,
    mineral: number,
    typeMin: number,
    typeMax: number,
  ): void => {
    for (let cluster = 0; cluster < numClusters; cluster += 1) {
      for (let tryIndex = 0; tryIndex < 100; tryIndex += 1) {
        const pos = getRandomCoordinate();
        if (hexagonTypesInRange(pos, typeMin, typeMax)) {
          let index = 0;
          const count = 2 + ((randomInt() >> 2) & 3);
          for (let j = 0; j < count; j += 1) {
            const amount = 4 * (count - j);
            index = expandMineralCluster(mineralIterations[j]!, pos, index, amount, mineral);
          }

          break;
        }
      }
    }
  };

  const deposits: readonly (readonly [number, number])[] = [
    [9, mapMinerals.coal],
    [4, mapMinerals.iron],
    [2, mapMinerals.gold],
    [2, mapMinerals.stone],
  ];
  for (const [multiplier, mineral] of deposits) {
    createRandomMineralClusters(regionCount * multiplier, mineral, mapTerrain.tundra0, mapTerrain.snow0);
  }

  // --- clean up ----------------------------------------------------------------------

  for (let pos = 0; pos < tileCount; pos += 1) {
    if (mapSpaceFromObject[objects[pos]!]! >= mapSpace.impassable) {
      for (const direction of clockwiseLeftThree) {
        const otherPosition = move(pos, direction);
        const space = mapSpaceFromObject[objects[otherPosition]!]!;

        let checkImpassable = false;
        if (
          !(positionColumn(pos) === 0 && direction === "Left") &&
          !((direction === "Up" || direction === "UpLeft") && positionRow(pos) === 0)
        ) {
          checkImpassable = space >= mapSpace.impassable;
        }

        if (isInWater(otherPosition) || checkImpassable) {
          objects[pos] = mapObject.none;
          break;
        }
      }
    }
  }

  return {
    size,
    columns,
    rows,
    tileCount,
    heights: Uint8Array.from(heights),
    typesUp,
    typesDown,
    objects,
    minerals,
    resourceAmounts,
  };
}
