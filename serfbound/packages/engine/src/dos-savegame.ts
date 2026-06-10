import { buildingType, SerfboundGameWorld, type BuildingTypeValue } from "./game-world.js";
import type { ClassicMapLandscape } from "./map-generator.js";

// Original DOS savegame (.SAV) loading, ported from the binary layout in
// Freeserf.Core Game.ReadFrom / Map.ReadFrom / Building.ReadFrom:
// the fixed-offset header, four 8628-byte player blocks each followed by
// a flags byte (bit 6 = active), 8 bytes per map tile in two row passes,
// then the serf/flag/building/inventory arrays behind their bitmaps.

export type DosSavegameBuilding = {
  readonly index: number;
  readonly position: number;
  readonly type: number;
  readonly player: number;
  readonly constructing: boolean;
  readonly threatLevel: number;
};

export type DosSavegame = {
  readonly gameType: number;
  readonly tick: number;
  readonly randomState: readonly [number, number, number];
  readonly mapSize: number;
  readonly goldMoraleFactor: number;
  readonly activePlayers: readonly number[];
  readonly map: {
    readonly columns: number;
    readonly rows: number;
    readonly heights: Uint8Array;
    readonly typesUp: Uint8Array;
    readonly typesDown: Uint8Array;
    readonly objects: Uint8Array;
    readonly owners: Int8Array;
    readonly paths: Uint8Array;
    readonly minerals: Uint8Array;
    readonly resourceAmounts: Uint8Array;
  };
  readonly buildings: readonly DosSavegameBuilding[];
};

class DosReader {
  readonly view: DataView;
  readonly bytes: Uint8Array;
  offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  remaining(): number {
    return this.bytes.length - this.offset;
  }

  skip(count: number): void {
    this.offset += count;
  }

  byte(): number {
    const value = this.bytes[this.offset]!;
    this.offset += 1;
    return value;
  }

  word(): number {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  dword(): number {
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }
}

// Map.PositionFromSavedValue: the DOS save stores 4-byte tile addresses
// (val >> 2 gives the column; shifting past rowShift + 1 gives the row).
function positionFromSavedValue(value: number, columns: number, rows: number): number {
  let adjusted = value >>> 2;
  const column = adjusted & (columns - 1);
  const rowShift = Math.log2(columns);
  adjusted >>>= rowShift + 1;
  const row = adjusted & (rows - 1);
  return row * columns + column;
}

export function parseDosSavegame(input: Uint8Array): DosSavegame | null {
  try {
    const reader = new DosReader(input);
    if (reader.remaining() < 250) {
      return null;
    }

    reader.skip(74);
    const gameType = reader.word(); // 74
    reader.skip(2);
    const tick = reader.word(); // 78
    reader.skip(4);
    const randomState: [number, number, number] = [reader.word(), reader.word(), reader.word()];
    const maxFlagIndex = reader.word(); // 90
    const maxBuildingIndex = reader.word(); // 92
    const maxSerfIndex = reader.word(); // 94
    reader.skip(2);
    reader.word(); // flag search counter @98
    reader.skip(4);
    reader.skip(4 * 2); // player history index
    reader.skip(3 * 2); // player history counter
    reader.word(); // resource history index @118
    reader.skip(54);
    reader.word(); // max inventory index @174
    reader.skip(14);
    const mapSize = reader.word(); // 190
    if (mapSize < 3 || mapSize > 10) {
      return null;
    }

    reader.skip(8);
    const goldMoraleFactor = reader.word(); // 200
    reader.skip(2);
    reader.byte(); // player score leader @204
    reader.skip(45); // -> 250

    // Player blocks: 8628 bytes each, then the activity flags byte.
    const activePlayers: number[] = [];
    for (let player = 0; player < 4; player += 1) {
      reader.skip(8628);
      const flags = reader.byte();
      if ((flags & (1 << 6)) !== 0) {
        activePlayers.push(player);
      }
    }

    // Map tiles: per row, pass 1 carries paths/height+owner/terrain/object,
    // pass 2 carries object indexes or minerals plus the serf word.
    const columns = mapColumnsForSize(mapSize);
    const rows = mapRowsForSize(mapSize);
    const tileCount = columns * rows;
    if (reader.remaining() < tileCount * 8) {
      return null;
    }

    const heights = new Uint8Array(tileCount);
    const typesUp = new Uint8Array(tileCount);
    const typesDown = new Uint8Array(tileCount);
    const objects = new Uint8Array(tileCount);
    const owners = new Int8Array(tileCount).fill(-1);
    const paths = new Uint8Array(tileCount);
    const minerals = new Uint8Array(tileCount);
    const resourceAmounts = new Uint8Array(tileCount);

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const position = row * columns + column;
        paths[position] = reader.byte() & 0x3f;
        const heightAndOwner = reader.byte();
        heights[position] = heightAndOwner & 0x1f;
        if (heightAndOwner >> 7 === 1) {
          owners[position] = ((heightAndOwner >> 5) & 0x03);
        }

        const terrain = reader.byte();
        typesUp[position] = (terrain >> 4) & 0x0f;
        typesDown[position] = terrain & 0x0f;
        objects[position] = reader.byte() & 0x7f;
      }

      for (let column = 0; column < columns; column += 1) {
        const position = row * columns + column;
        const objectValue = objects[position]!;
        // Reference rule: flag (1) through castle (4) carries the object
        // index word; everything else carries minerals plus a one-byte
        // object index.
        if (objectValue >= 1 && objectValue <= 4) {
          reader.word();
        } else {
          const resource = reader.byte();
          minerals[position] = (resource >> 5) & 7;
          resourceAmounts[position] = resource & 0x1f;
          reader.byte();
        }

        reader.word(); // serf index
      }
    }

    // Serf array: bitmap + 16-byte records (skipped; serfs respawn from
    // the engine's logistics — recorded condensation).
    skipBitmapArray(reader, maxSerfIndex, 16);
    // Flag array: bitmap + 70-byte records (roads rebuild from map paths).
    skipBitmapArray(reader, maxFlagIndex, 70);

    // Buildings: bitmap + 18-byte records.
    const buildings: DosSavegameBuilding[] = [];
    const buildingBitmapSize = 4 * Math.floor((maxBuildingIndex + 31) / 32);
    const buildingBitmap = reader.bytes.subarray(
      reader.offset,
      reader.offset + buildingBitmapSize,
    );
    reader.skip(buildingBitmapSize);
    for (let index = 0; index < maxBuildingIndex; index += 1) {
      const start = reader.offset;
      if ((buildingBitmap[index >> 3]! & (1 << (7 - (index & 7)))) !== 0) {
        const positionValue = reader.dword();
        const v8 = reader.byte();
        const flags = reader.byte();
        buildings.push({
          index,
          position: positionFromSavedValue(positionValue, columns, rows),
          type: (v8 >> 2) & 0x1f,
          player: v8 & 3,
          constructing: (v8 & 0x80) !== 0,
          threatLevel: flags & 3,
        });
      }

      reader.offset = start + 18;
    }

    return {
      gameType,
      tick,
      randomState,
      mapSize,
      goldMoraleFactor,
      activePlayers,
      map: {
        columns,
        rows,
        heights,
        typesUp,
        typesDown,
        objects,
        owners,
        paths,
        minerals,
        resourceAmounts,
      },
      buildings,
    };
  } catch {
    return null;
  }
}

function skipBitmapArray(reader: DosReader, maxIndex: number, recordSize: number): void {
  // The reference extracts one record per index unconditionally; the
  // bitmap only marks which records carry live objects.
  const bitmapSize = 4 * Math.floor((maxIndex + 31) / 32);
  reader.skip(bitmapSize);
  reader.skip(maxIndex * recordSize);
}

// MapGeometry column/row rule for DOS map sizes (the engine's own rule:
// columnSize = 5 + size/2, rowSize = 5 + (size-1)/2).
export function mapColumnsForSize(size: number): number {
  return 1 << (5 + Math.floor(size / 2));
}

export function mapRowsForSize(size: number): number {
  return 1 << (5 + Math.floor((size - 1) / 2));
}

// Continue a parsed DOS save as a playable world: the saved landscape and
// territory restore directly, castles re-found their players (with the
// default supplies preset — saved inventories are a recorded follow-up),
// and completed buildings return as standing structures.
export function continueFromDosSavegame(save: DosSavegame): {
  world: SerfboundGameWorld;
  landscape: ClassicMapLandscape;
} {
  const tileCount = save.map.columns * save.map.rows;
  const landscape: ClassicMapLandscape = {
    size: save.mapSize,
    columns: save.map.columns,
    rows: save.map.rows,
    tileCount,
    heights: Uint8Array.from(save.map.heights),
    typesUp: Uint8Array.from(save.map.typesUp),
    typesDown: Uint8Array.from(save.map.typesDown),
    // Buildings and flags re-place themselves; the landscape keeps the
    // natural objects (flags 1..4 are structural and re-place).
    objects: Uint8Array.from(save.map.objects, (value) =>
      value >= 1 && value <= 4 ? 0 : value,
    ),
    minerals: Uint8Array.from(save.map.minerals),
    resourceAmounts: Uint8Array.from(save.map.resourceAmounts),
  };

  const playerCount = Math.max(1, save.activePlayers.length);
  const world = new SerfboundGameWorld(landscape, playerCount);

  // Castles first (they create inventories and territory), then the rest.
  const sorted = [...save.buildings].sort((left, right) =>
    left.type === buildingType.castle ? -1 : right.type === buildingType.castle ? 1 : 0,
  );
  for (const saved of sorted) {
    if (saved.player >= playerCount) {
      continue;
    }

    if (saved.type === buildingType.castle) {
      world.buildCastle(saved.position, saved.player);
      continue;
    }

    const building = world.buildBuilding(
      saved.position,
      saved.type as BuildingTypeValue,
      saved.player,
      0,
    );
    if (building !== null && !saved.constructing) {
      building.isDone = true;
      building.threatLevel = saved.threatLevel;
    }
  }

  return { world, landscape };
}
