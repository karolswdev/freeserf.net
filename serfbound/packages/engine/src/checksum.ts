import { directions } from "./index.js";
import type { SerfboundGameState } from "./simulation.js";
import type { SerfboundGameWorld } from "./game-world.js";
import type { SerfboundSerfEngine } from "./serfs.js";

// Per-tick world-state checksums (SB-22-01): the lockstep contract is
// that identical settings + seed + action schedule produce identical
// materialized state on every peer. This hashes that materialized state
// — the map arrays, every flag/building/inventory/player, every serf,
// and the RNG/tick clocks — so peers can compare cheap fingerprints and
// catch divergence at the exact tick it appears.
//
// FNV-1a (32-bit) over a fixed-order structural walk. Iteration order
// is pinned everywhere: entity maps walk sorted indexes, records walk
// sorted keys, flag paths walk the canonical direction order.

const fnvOffset = 0x811c9dc5;
const fnvPrime = 0x01000193;

export class StateHasher {
  #hash = fnvOffset;

  get value(): number {
    return this.#hash >>> 0;
  }

  byte(value: number): void {
    this.#hash = Math.imul(this.#hash ^ (value & 0xff), fnvPrime) >>> 0;
  }

  // Numbers fold as 32-bit two's complement plus a tag byte for
  // null/boolean disambiguation at call sites that need it.
  int(value: number): void {
    const v = value | 0;
    this.#hash = Math.imul(this.#hash ^ (v & 0xff), fnvPrime) >>> 0;
    this.#hash = Math.imul(this.#hash ^ ((v >>> 8) & 0xff), fnvPrime) >>> 0;
    this.#hash = Math.imul(this.#hash ^ ((v >>> 16) & 0xff), fnvPrime) >>> 0;
    this.#hash = Math.imul(this.#hash ^ ((v >>> 24) & 0xff), fnvPrime) >>> 0;
  }

  intOrNull(value: number | null): void {
    if (value === null) {
      this.byte(0xfe);
    } else {
      this.byte(0x01);
      this.int(value);
    }
  }

  bool(value: boolean): void {
    this.byte(value ? 1 : 0);
  }

  bytes(values: Uint8Array | Int8Array | Uint8ClampedArray): void {
    let hash = this.#hash;
    for (let index = 0; index < values.length; index += 1) {
      hash = Math.imul(hash ^ (values[index]! & 0xff), fnvPrime) >>> 0;
    }

    this.#hash = hash;
  }

  ints(values: Uint32Array | Int32Array | readonly number[]): void {
    for (let index = 0; index < values.length; index += 1) {
      this.int(values[index]!);
    }
  }

  // Records keyed by numeric strings (delivered/requested resources)
  // hash in sorted numeric key order; zero counts are skipped so a key
  // that was never touched hashes like one that returned to zero.
  numericRecord(record: Record<number, number>): void {
    const keys = Object.keys(record)
      .map(Number)
      .filter((key) => record[key] !== 0)
      .sort((a, b) => a - b);
    this.int(keys.length);
    for (const key of keys) {
      this.int(key);
      this.int(record[key]!);
    }
  }
}

function sortedIndexes(keys: Iterable<number>): number[] {
  return [...keys].sort((a, b) => a - b);
}

export function hashWorld(hasher: StateHasher, world: SerfboundGameWorld): void {
  hasher.bytes(world.heights);
  hasher.bytes(world.typesUp);
  hasher.bytes(world.typesDown);
  hasher.bytes(world.objects);
  hasher.bytes(world.minerals);
  hasher.bytes(world.resourceAmounts);
  hasher.bytes(world.paths);
  hasher.bytes(new Uint8Array(world.owners.buffer, world.owners.byteOffset, world.owners.length));
  hasher.ints(world.objectIndexes);

  hasher.int(world.flags.size);
  for (const index of sortedIndexes(world.flags.keys())) {
    const flag = world.flags.get(index)!;
    hasher.int(flag.index);
    hasher.int(flag.position);
    hasher.int(flag.player);
    hasher.intOrNull(flag.buildingIndex);
    hasher.bool(flag.hasInventory);
    for (const direction of directions) {
      const path = flag.paths[direction];
      hasher.bool(path.hasPath);
      hasher.bool(path.water);
      hasher.int(path.lengthCategory);
      hasher.int(path.freeTransporters);
      hasher.bool(path.serfRequested);
      hasher.int(path.otherFlagIndex);
      hasher.intOrNull(
        path.otherEndDirection === null ? null : directions.indexOf(path.otherEndDirection),
      );
    }

    for (const slot of flag.slots) {
      hasher.int(slot.resource);
      hasher.int(slot.destinationFlagIndex);
      hasher.intOrNull(
        slot.scheduledDirection === null ? null : directions.indexOf(slot.scheduledDirection),
      );
    }
  }

  hasher.int(world.buildings.size);
  for (const index of sortedIndexes(world.buildings.keys())) {
    const building = world.buildings.get(index)!;
    hasher.int(building.index);
    hasher.int(building.position);
    hasher.int(building.player);
    hasher.int(building.type);
    hasher.int(building.flagIndex);
    hasher.int(building.levelHeight);
    hasher.bool(building.isDone);
    hasher.int(building.progress);
    hasher.int(building.startTick);
    hasher.numericRecord(building.deliveredResources);
    hasher.numericRecord(building.requestedResources);
    hasher.int(building.builderTicks);
    hasher.int(building.consumedMaterials);
    hasher.int(building.knights);
    hasher.int(building.requestedKnights);
    hasher.int(building.threatLevel);
  }

  hasher.int(world.inventories.size);
  for (const index of sortedIndexes(world.inventories.keys())) {
    const inventory = world.inventories.get(index)!;
    hasher.int(inventory.index);
    hasher.int(inventory.player);
    hasher.int(inventory.buildingIndex);
    hasher.int(inventory.flagIndex);
    hasher.ints(inventory.resources);
    hasher.int(inventory.genericSerfs);
    hasher.int(inventory.knights);
    hasher.int(inventory.pendingOut.length);
    for (const pending of inventory.pendingOut) {
      hasher.int(pending.resource);
      hasher.int(pending.destinationFlagIndex);
    }
  }

  hasher.int(world.players.length);
  for (const player of world.players) {
    hasher.int(player.index);
    hasher.bool(player.hasCastle);
    hasher.intOrNull(player.castlePosition);
    hasher.int(player.landArea);
    hasher.int(player.knightMorale);
    hasher.int(player.goldDeposited);
    hasher.int(player.castleKnightsWanted);
    hasher.ints(player.knightOccupation);
    hasher.bool(player.defeated);
  }
}

export function hashSerfEngine(hasher: StateHasher, engine: SerfboundSerfEngine): void {
  hasher.int(engine.serfs.size);
  for (const index of sortedIndexes(engine.serfs.keys())) {
    const serf = engine.serfs.get(index)!;
    hasher.int(serf.index);
    hasher.int(serf.player);
    hasher.int(serf.state);
    hasher.int(serf.position);
    hasher.int(serf.tick);
    hasher.int(serf.animation);
    hasher.int(serf.counter);
    hasher.int(serf.walkingDirection);
    hasher.int(serf.walkingDestination);
    hasher.int(serf.walkingWaitCounter);
    hasher.int(serf.slopeLength);
    hasher.int(serf.nextState);
    hasher.int(serf.roadFlagIndex);
    hasher.intOrNull(
      serf.roadDirection === null ? null : directions.indexOf(serf.roadDirection),
    );
    hasher.int(serf.carriedResource);
    hasher.int(serf.carriedDestination);
    hasher.int(serf.buildTargetIndex);
    hasher.int(serf.workBuildingIndex);
    hasher.int(serf.workPhase);
    hasher.int(serf.workCounter);
    hasher.int(serf.workTargetPosition);
    hasher.bool(serf.isKnight);
    hasher.int(serf.garrisonTargetIndex);
    hasher.int(serf.knightRank);
    hasher.int(serf.attackTargetIndex);
    hasher.int(serf.fightOpponentIndex);
    hasher.int(serf.fightMove);
    hasher.bool(serf.fightWon);
  }

  hasher.ints(engine.serfIndexes);
  hasher.ints(engine.random.state);
}

// The full fingerprint of a running game at a tick.
export function computeGameChecksum(options: {
  readonly world: SerfboundGameWorld;
  readonly serfEngine?: SerfboundSerfEngine;
  readonly state?: SerfboundGameState;
}): number {
  const hasher = new StateHasher();
  hashWorld(hasher, options.world);
  if (options.serfEngine !== undefined) {
    hashSerfEngine(hasher, options.serfEngine);
  }

  if (options.state !== undefined) {
    hasher.int(options.state.tick);
    hasher.ints(options.state.random.state);
  }

  return hasher.value;
}

export type ChecksumRecord = {
  readonly tick: number;
  readonly checksum: number;
};

// Compare two checksum streams; the first tick both recorded but
// disagree on is the desync tick. Streams may cover different ranges —
// only shared ticks compare.
export function firstChecksumDivergence(
  left: readonly ChecksumRecord[],
  right: readonly ChecksumRecord[],
): number | null {
  const rightByTick = new Map(right.map((record) => [record.tick, record.checksum]));
  for (const record of left) {
    const other = rightByTick.get(record.tick);
    if (other !== undefined && other !== record.checksum) {
      return record.tick;
    }
  }

  return null;
}
